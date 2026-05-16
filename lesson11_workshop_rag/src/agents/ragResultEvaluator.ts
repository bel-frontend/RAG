import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { chatModel } from '../../../common/model';
import { config } from '../config';
import { parseStructuredOutput, schemaInstruction } from './json';
import {
  EvaluationResultSchema,
  type EvaluationResult,
  type RerankedSource,
  type SearchPlan,
  type ToolName,
} from './schemas';

const EVALUATOR_SYSTEM_PROMPT = [
  'You are a RAG sufficiency grader.',
  'You receive a user question and a small set of already reranked top text chunks.',
  'Decide whether the chunks together contain enough information to answer the question.',
  'For narrow factual questions require that the answer is explicitly present in the chunks.',
  'For list, section, or explore requests (proverbs, signs, examples), treat any meaningful topical coverage as sufficient.',
  'Set qualityScore to a 0.0–1.0 estimate of overall answer quality given these chunks.',
  'If sufficientForAnswer is false, explain in evaluationReason what is missing or unclear.',
  'Do not re-rank, drop, or invent sources — relevantSources must echo the input chunks unchanged.',
].join(' ');

export class RagResultEvaluator {
  async evaluate(
    question: string,
    rankedSources: RerankedSource[],
    tool: ToolName,
    plan?: SearchPlan
  ): Promise<EvaluationResult> {
    if (rankedSources.length === 0) {
      return emptyEvaluation('No reranked sources available.');
    }

    const model = await chatModel(config.chat.model, {
      ollamaUrl: config.chat.ollamaUrl,
    });

    const resultMode = plan?.resultMode || 'answer';
    const isBroad = resultMode === 'list' || resultMode === 'section' || resultMode === 'explore';

    try {
      const response = await model.invoke([
        new SystemMessage(EVALUATOR_SYSTEM_PROMPT),
        new SystemMessage(
          schemaInstruction(
            'EvaluationResult',
            '{"sufficientForAnswer":boolean,"qualityScore":0.0-1.0,"evaluationReason":"string","relevantSources":[]}'
          )
        ),
        new HumanMessage(
          JSON.stringify({
            question,
            resultMode,
            tool,
            isBroad,
            rerankedSources: rankedSources.map((source, index) => ({
              id: index + 1,
              fileName: source.fileName,
              page: source.page,
              relevanceScore: source.relevanceScore,
              text: source.text.slice(0, 600),
            })),
          })
        ),
      ]);

      const parsed = parseStructuredOutput(response.content, EvaluationResultSchema, fallbackEvaluation(rankedSources, isBroad));

      return {
        ...parsed,
        relevantSources: rankedSources,
      };
    } catch {
      return fallbackEvaluation(rankedSources, isBroad);
    }
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

function fallbackEvaluation(sources: RerankedSource[], isBroad: boolean): EvaluationResult {
  const averageRelevance =
    sources.reduce((sum, source) => sum + source.relevanceScore, 0) / Math.max(sources.length, 1);

  return {
    sufficientForAnswer: isBroad ? sources.length > 0 : sources.some((source) => source.relevanceScore >= 0.4),
    qualityScore: averageRelevance,
    evaluationReason: 'Evaluator fallback based on rerank scores.',
    relevantSources: sources,
  };
}
