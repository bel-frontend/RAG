import { config } from '../config';
import type { HybridRetriever } from '../rag/hybridRetriever';
import {
  collectSearchResults,
  perQueryLimitForMode,
  resultLimitForMode,
} from '../rag/resultCollector';
import type { RagSearchOutput, SearchPlan } from './schemas';
import { fallbackPlan } from './queryPlannerAgent';

export class RagSearchAgent {
  constructor(private readonly retriever: HybridRetriever) {}

  async search(query: string): Promise<RagSearchOutput> {
    return this.searchPlan(fallbackPlan(query, 'rag_search'));
  }

  async searchPlan(plan: SearchPlan): Promise<RagSearchOutput> {
    if (!config.qdrant.url) {
      throw new Error('QDRANT_URL is required for RagSearchAgent');
    }

    const broadMode = plan.resultMode === 'list' || plan.resultMode === 'explore';
    const finalLimit = resultLimitForMode({
      desiredResultCount: plan.desiredResultCount,
      fallbackLimit: config.server.topK,
      maxLimit: broadMode ? 50 : config.server.topK,
    });
    const perQueryLimit = perQueryLimitForMode({
      finalLimit,
      fallbackLimit: config.server.topK,
      broadMode,
    });
    const queries = buildRagQueries(plan);
    const searchResults = await Promise.all(
      queries.map(async (query) => ({
        query,
        sources: await this.retriever.retrieve(query, perQueryLimit),
      }))
    );
    const { sources, queryBreakdown } = collectSearchResults({
      queryResults: searchResults,
      limit: finalLimit,
      perQueryKeep: perQueryLimit,
    });

    return {
      query: queries.join(' | '),
      found: sources.length > 0,
      sources,
      sourceCount: sources.length,
      queryBreakdown,
    };
  }
}

function buildRagQueries(plan: SearchPlan): string[] {
  return [...new Set([
    ...plan.expandedQueries,
    ...(plan.semanticFacets || []).map((facet) => `${plan.coreQuery} ${facet}`),
    ...(plan.resultMode === 'explore' ? (plan.semanticFacets || []) : []),
  ].filter(Boolean))].slice(0, 14);
}
