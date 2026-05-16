import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { chatModel } from '../../../common/model';
import { config } from '../config';
import type { DialectDictionarySearchTool } from './dialectDictionarySearchTool';
import type { FolkWisdomSearchTool } from './folkWisdomSearchTool';
import { QueryPlannerAgent, fallbackPlan } from './queryPlannerAgent';
import { RagResultEvaluator } from './ragResultEvaluator';
import type { RagSearchAgent } from './ragSearchAgent';
import {
  FinalAnswerSchema,
  OrchestratorDecisionSchema,
  type ChatAgentResponse,
  type ChatMessage,
  type EvaluationResult,
  type FinalAnswer,
  type OrchestratorDecision,
  type RagSearchOutput,
  type ToolName,
} from './schemas';
import { parseStructuredOutput, schemaInstruction } from './json';

const DECISION_SYSTEM_PROMPT = [
  'You are the chat orchestrator agent for a RAG workshop.',
  'You receive a chat history and the latest user question.',
  'Decide whether to answer directly or call the RAG search agent.',
  'Use search_rag for questions about PDF content, lesson materials, definitions, facts, citations, or when the user asks to find something.',
  'Use search_folk_wisdom when the user asks for proverbs, sayings, folk wisdom, aphorisms, or народныя мудрасці.',
  'Use search_dialect_dictionary when the user asks about Vusacki Slovazbor, Ryhor Baradulin, dialect words, meanings, local expressions, curses, threats, or гразьбы from the first book.',
  'If the user asks for something from a book, PDF, document, source, collection, or lesson file, you must choose search_rag.',
  'Use answer_directly for greetings, UI/help questions, or general conversation that does not need the PDF collection.',
].join(' ');

const FINAL_SYSTEM_PROMPT = [
  'You are the final chat agent.',
  'Answer in Belarusian unless the user clearly asks for another language.',
  'Use only the provided RAG context for factual claims.',
  'Never invent examples, quotes, proverbs, citations, titles, page numbers, or source names.',
  'If the user asks for examples or proverbs from a book, provide only items that are explicitly present in the RAG context.',
  'If context is missing or insufficient, say that the documents do not contain enough data.',
  'Keep the answer useful as a chat response, not as a raw search dump.',
].join(' ');

const LIST_FINAL_SYSTEM_PROMPT = [
  'You are the final chat agent presenting search results from a Belarusian text collection.',
  'Answer in Belarusian unless the user clearly asks for another language.',
  'Use only the provided RAG context. Never invent or add items not present in the context.',
  'If the user asks for proverbs, sayings, folk wisdom, dictionary entries, or any list of items,',
  'present EVERY found item as a numbered list: "1. ...", "2. ...", etc.',
  'Each list item must be on its own line.',
  'Do not merge, summarise, or paraphrase individual proverbs or dictionary entries — quote them exactly from the context.',
  'After the list you may add a short concluding sentence if useful.',
  'If context is missing or insufficient, say that the documents do not contain enough data.',
].join(' ');

export class ChatOrchestratorAgent {
  private readonly evaluator = new RagResultEvaluator();

  constructor(
    private readonly ragSearchAgent: RagSearchAgent,
    private readonly folkWisdomSearchTool: FolkWisdomSearchTool,
    private readonly dialectDictionarySearchTool: DialectDictionarySearchTool,
    private readonly queryPlannerAgent = new QueryPlannerAgent()
  ) {}

  async chat(messages: ChatMessage[]): Promise<ChatAgentResponse> {
    const latestQuestion = latestUserMessage(messages);
    const decision = requiresDialectDictionaryTool(latestQuestion)
      ? forcedDialectDictionaryDecision(latestQuestion)
      : requiresFolkWisdomTool(latestQuestion)
      ? forcedFolkWisdomDecision(latestQuestion)
      : requiresDocumentSearch(latestQuestion)
        ? forcedRagDecision(latestQuestion)
        : await this.decide(messages, latestQuestion);

    if (decision.action === 'answer_directly') {
      return {
        answer: decision.directAnswer || 'Чым магу дапамагчы?',
        usedRag: false,
        sources: [],
        trace: {
          orchestratorDecision: decision,
          usedTool: 'chat',
          citations: [],
        },
      };
    }

    const searchQuery = decision.searchQuery?.trim() || latestQuestion;
    const usedTool = toolForDecision(decision);

    // First search attempt
    const { searchOutput, searchPlan, evaluation } = await this.searchAndEvaluate(
      messages, latestQuestion, searchQuery, usedTool
    );

    // Retry once if evaluator says results are insufficient
    const finalResult = !evaluation.sufficientForAnswer
      ? await this.retrySearch(messages, latestQuestion, searchQuery, usedTool, searchOutput, evaluation)
      : { searchOutput, searchPlan, evaluation };

    const enforcedPlan = { ...finalResult.searchPlan, tool: usedTool };
    const bestOutput = finalResult.searchOutput;
    const bestEvaluation = finalResult.evaluation;

    // Use evaluator-filtered sources; fall back to raw sources if evaluator returned none
    const sourcesForAnswer = bestEvaluation.relevantSources.length > 0
      ? bestEvaluation.relevantSources
      : bestOutput.sources;

    if (!bestOutput.found || sourcesForAnswer.length === 0) {
      return {
        answer:
          'У загружаных дакументах не знайшлося дастатковых дадзеных для адказу на гэтае пытанне. Я не буду прыдумляць прыклады без крыніц.',
        usedRag: true,
        searchQuery,
        sources: [],
        trace: {
          orchestratorDecision: decision,
          usedTool,
          searchPlan: enforcedPlan,
          citations: [],
          evaluationResult: bestEvaluation,
        },
      };
    }

    const finalAnswer = await this.answerWithContext(
      messages,
      latestQuestion,
      { ...bestOutput, sources: sourcesForAnswer },
      bestEvaluation,
      usedTool
    );

    return {
      answer: finalAnswer.answer,
      usedRag: true,
      searchQuery,
      sources: sourcesForAnswer,
      trace: {
        orchestratorDecision: decision,
        usedTool,
        searchPlan: enforcedPlan,
        citations: finalAnswer.citations,
        evaluationResult: bestEvaluation,
      },
    };
  }

  private async searchAndEvaluate(
    messages: ChatMessage[],
    latestQuestion: string,
    searchQuery: string,
    usedTool: ToolName
  ): Promise<{ searchOutput: RagSearchOutput; searchPlan: ReturnType<typeof fallbackPlan>; evaluation: EvaluationResult }> {
    const searchPlan =
      usedTool === 'chat'
        ? fallbackPlan(searchQuery, usedTool)
        : await this.queryPlannerAgent.plan(messages, searchQuery, usedTool);
    const enforcedPlan = { ...searchPlan, tool: usedTool };

    const searchOutput =
      usedTool === 'dialect_dictionary_search'
        ? await this.dialectDictionarySearchTool.invokePlan(enforcedPlan)
        : usedTool === 'folk_wisdom_search'
        ? await this.folkWisdomSearchTool.invokePlan(enforcedPlan)
        : await this.ragSearchAgent.searchPlan(enforcedPlan);

    const evaluation = await this.evaluator.evaluate(latestQuestion, searchOutput, usedTool);

    return { searchOutput, searchPlan, evaluation };
  }

  private async retrySearch(
    messages: ChatMessage[],
    latestQuestion: string,
    searchQuery: string,
    usedTool: ToolName,
    prevOutput: RagSearchOutput,
    prevEvaluation: EvaluationResult
  ): Promise<{ searchOutput: RagSearchOutput; searchPlan: ReturnType<typeof fallbackPlan>; evaluation: EvaluationResult }> {
    const retryHint = `${searchQuery} — попередній пошук: ${prevEvaluation.evaluationReason}`;
    const result = await this.searchAndEvaluate(messages, latestQuestion, retryHint, usedTool);

    // Keep whichever result has a higher quality score
    if (result.evaluation.qualityScore >= prevEvaluation.qualityScore) {
      return result;
    }

    return { searchOutput: prevOutput, searchPlan: fallbackPlan(searchQuery, usedTool), evaluation: prevEvaluation };
  }

  private async decide(
    messages: ChatMessage[],
    latestQuestion: string
  ): Promise<OrchestratorDecision> {
    const model = await chatModel(config.chat.model, {
      ollamaUrl: config.chat.ollamaUrl,
    });

    const response = await model.invoke([
      new SystemMessage(DECISION_SYSTEM_PROMPT),
      new SystemMessage(
        schemaInstruction(
          'OrchestratorDecision',
          '{"action":"answer_directly|search_rag|search_folk_wisdom|search_dialect_dictionary","searchQuery":"string optional","directAnswer":"string optional","reason":"string"}'
        )
      ),
      new HumanMessage(
        JSON.stringify({
          latestQuestion,
          messages,
        })
      ),
    ]);

    return parseStructuredOutput(
      response.content,
      OrchestratorDecisionSchema,
      fallbackDecision(latestQuestion)
    );
  }

  private async answerWithContext(
    messages: ChatMessage[],
    latestQuestion: string,
    searchOutput: RagSearchOutput,
    evaluation: EvaluationResult,
    usedTool: ToolName
  ): Promise<FinalAnswer> {
    const isListTool = usedTool === 'folk_wisdom_search' || usedTool === 'dialect_dictionary_search';
    const systemPrompt = isListTool ? LIST_FINAL_SYSTEM_PROMPT : FINAL_SYSTEM_PROMPT;
    const model = await chatModel(config.chat.model, {
      ollamaUrl: config.chat.ollamaUrl,
    });

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new SystemMessage(
        schemaInstruction(
          'FinalAnswer',
          '{"answer":"string","usedRag":true,"citations":["file names or source labels"]}'
        )
      ),
      ...messages.slice(-8).map(toLangChainMessage),
      new HumanMessage(
        JSON.stringify({
          latestQuestion,
          evaluationQualityScore: evaluation.qualityScore,
          evaluationSufficient: evaluation.sufficientForAnswer,
          ragSearch: {
            query: searchOutput.query,
            found: searchOutput.found,
            sources: searchOutput.sources.map((source, index) => ({
              id: index + 1,
              fileName: source.fileName,
              page: source.page,
              score: source.score,
              relevanceScore: 'relevanceScore' in source ? (source as { relevanceScore: number }).relevanceScore : source.score,
              text: source.text,
            })),
          },
        })
      ),
    ]);

    return parseStructuredOutput(response.content, FinalAnswerSchema, {
      answer:
        'Не атрымалася атрымаць структураваны адказ ад мадэлі. Паспрабуйце перафармуляваць пытанне.',
      usedRag: true,
      citations: [],
    });
  }
}

function latestUserMessage(messages: ChatMessage[]): string {
  const latest = [...messages].reverse().find((message) => message.role === 'user');
  if (!latest) {
    throw new Error('At least one user message is required');
  }

  return latest.content;
}

function fallbackDecision(latestQuestion: string): OrchestratorDecision {
  if (requiresDialectDictionaryTool(latestQuestion)) {
    return forcedDialectDictionaryDecision(latestQuestion);
  }

  if (requiresFolkWisdomTool(latestQuestion)) {
    return forcedFolkWisdomDecision(latestQuestion);
  }

  if (requiresDocumentSearch(latestQuestion)) {
    return forcedRagDecision(latestQuestion);
  }

  if (/^(hi|hello|вітаю|прывітанне|добры дзень|дзякуй|thanks)/i.test(latestQuestion.trim())) {
    return {
      action: 'answer_directly',
      directAnswer: 'Вітаю. Можам проста паразмаўляць або пашукаць адказ у PDF-дакументах.',
      reason: 'Fallback: conversational message does not require RAG.',
    };
  }

  return {
    action: 'search_rag',
    searchQuery: latestQuestion,
    reason: 'Fallback: structured decision parsing failed.',
  };
}

function forcedRagDecision(latestQuestion: string): OrchestratorDecision {
  return {
    action: 'search_rag',
    searchQuery: latestQuestion,
    reason: 'Forced RAG: the question asks for information from books/documents/sources.',
  };
}

function forcedFolkWisdomDecision(latestQuestion: string): OrchestratorDecision {
  return {
    action: 'search_folk_wisdom',
    searchQuery: latestQuestion,
    reason: 'Forced tool: the question asks for proverbs, sayings, or other folk wisdom.',
  };
}

function forcedDialectDictionaryDecision(latestQuestion: string): OrchestratorDecision {
  return {
    action: 'search_dialect_dictionary',
    searchQuery: latestQuestion,
    reason:
      'Forced tool: the question asks about Vusacki Slovazbor, dialect words, local expressions, curses, or the first book.',
  };
}

function toolForDecision(decision: OrchestratorDecision): ToolName {
  if (decision.action === 'search_dialect_dictionary') return 'dialect_dictionary_search';
  if (decision.action === 'search_folk_wisdom') return 'folk_wisdom_search';
  if (decision.action === 'search_rag') return 'rag_search';
  return 'chat';
}

function requiresDialectDictionaryTool(question: string): boolean {
  return /\b(vusacki|slovazbor|baradulin|dialect|dictionary|curse|curses|threat|threats)\b/i.test(
    question
  )
    || /(вушацк|словазбор|барадулін|барадуліна|дыялект|слоўнік|значэн|тлумач|мясцов|праклён|праклены|праклёны|гразьб|лаянк|клят|пагроз|першай кніг|першая кніг|устойлів\w*\s+выраз|прыкмет|лекаван|страв|звыча|раздзел)/i.test(
      question
    );
}

function requiresFolkWisdomTool(question: string): boolean {
  return /\b(proverb|proverbs|saying|sayings|folk wisdom|aphorism|aphorisms)\b/i.test(question)
    || /(прыказк|прымаўк|народн\w*\s+мудрасц|прыслоў|выслоў|афарызм)/i.test(question);
}

function requiresDocumentSearch(question: string): boolean {
  return /\b(book|books|pdf|document|documents|source|sources|citation|citations|lesson|file|files)\b/i.test(
    question
  )
    || /(кніг|кнізе|кнігі|кніж|дакумент|pdf|пдф|крыніц|крыніцы|цытат|урок|файл|калекцы|з кнігі|у кнізе|з дакумента|у дакуменце|з pdf|у pdf|прыказк|прымаўк)/i.test(
      question
    );
}

function toLangChainMessage(message: ChatMessage): HumanMessage | AIMessage {
  return message.role === 'user'
    ? new HumanMessage(message.content)
    : new AIMessage(message.content);
}
