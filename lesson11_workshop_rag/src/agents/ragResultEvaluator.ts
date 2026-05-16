import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { chatModel } from '../../../common/model';
import { config } from '../config';
import { parseStructuredOutput, schemaInstruction } from './json';
import {
  EvaluationResultSchema,
  type EvaluationResult,
  type RagSearchOutput,
  type ToolName,
} from './schemas';

const EVALUATOR_SYSTEM_PROMPT = [
  'You are a RAG retrieval evaluator.',
  'You receive a user question and a list of retrieved text chunks.',
  'Your job is to decide how relevant each chunk is to the question.',
  'Assign a relevanceScore from 0.0 (completely irrelevant) to 1.0 (directly answers the question).',
  'Set sufficientForAnswer to true if the relevant chunks together contain enough information to answer the question.',
  'Set qualityScore to the average relevanceScore of chunks with score >= 0.3.',
  'Include in relevantSources only chunks with relevanceScore >= 0.25.',
  'Be strict: prefer fewer high-quality chunks over many weak ones.',
  'If sufficientForAnswer is false, explain clearly what is missing in evaluationReason.',
].join(' ');

// For list-style tools (folk wisdom, dialect), treat any found chunk as sufficient
// since individual proverbs/entries are intentionally short and varied.
const LENIENT_EVALUATOR_SYSTEM_PROMPT = [
  'You are a RAG retrieval evaluator for a collection of short text entries (proverbs, dictionary entries, folk wisdom).',
  'Each chunk may be a standalone short entry — evaluate the collection as a whole, not individual entries.',
  'Assign a relevanceScore from 0.0 to 1.0 for each chunk.',
  'Set sufficientForAnswer to true if at least some chunks are topically related to the question.',
  'Set qualityScore to the average relevanceScore of chunks with score >= 0.2.',
  'Include in relevantSources all chunks with relevanceScore >= 0.2.',
  'Set sufficientForAnswer to false only if zero chunks relate to the question topic.',
].join(' ');

export class RagResultEvaluator {
  async evaluate(
    question: string,
    searchOutput: RagSearchOutput,
    tool: ToolName
  ): Promise<EvaluationResult> {
    if (!searchOutput.found || searchOutput.sources.length === 0) {
      return emptyEvaluation('No sources retrieved.');
    }

    const model = await chatModel(config.chat.model, {
      ollamaUrl: config.chat.ollamaUrl,
    });

    const isLenient = tool === 'folk_wisdom_search' || tool === 'dialect_dictionary_search';
    const systemPrompt = isLenient ? LENIENT_EVALUATOR_SYSTEM_PROMPT : EVALUATOR_SYSTEM_PROMPT;

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new SystemMessage(
        schemaInstruction(
          'EvaluationResult',
          '{"sufficientForAnswer":boolean,"qualityScore":0.0-1.0,"evaluationReason":"string","relevantSources":[{"text":"string","score":number,"fileName":"string","page":number,"relevanceScore":0.0-1.0,"relevanceReason":"string"}]}'
        )
      ),
      new HumanMessage(
        JSON.stringify({
          question,
          retrievedSources: searchOutput.sources.map((source, index) => ({
            id: index + 1,
            fileName: source.fileName,
            page: source.page,
            score: source.score,
            text: source.text.slice(0, 600),
          })),
        })
      ),
    ]);

    const fallback = gracefulFallback(searchOutput, isLenient);

    return parseStructuredOutput(response.content, EvaluationResultSchema, fallback);
  }
}

function emptyEvaluation(reason: string): EvaluationResult {
  return {
    sufficientForAnswer: false,
    qualityScore: 0,
    evaluationReason: reason,
    relevantSources: [],
  };
}

function gracefulFallback(searchOutput: RagSearchOutput, lenient: boolean): EvaluationResult {
  const sources = searchOutput.sources.map((source) => ({
    ...source,
    relevanceScore: source.score,
  }));

  return {
    sufficientForAnswer: lenient ? sources.length > 0 : sources.some((s) => s.score >= 0.3),
    qualityScore: sources.reduce((acc, s) => acc + s.score, 0) / Math.max(sources.length, 1),
    evaluationReason: 'Evaluation parse failed — using raw retrieval scores as fallback.',
    relevantSources: sources,
  };
}
