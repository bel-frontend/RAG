import { config } from '../config';
import type { HybridRetriever } from '../rag/hybridRetriever';
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

    const searchResults = await Promise.all(
      plan.expandedQueries.map((query) => this.retriever.retrieve(query))
    );
    const sources = mergeSources(searchResults.flat()).slice(0, config.server.topK);

    return {
      query: plan.expandedQueries.join(' | '),
      found: sources.length > 0,
      sources,
      sourceCount: sources.length,
    };
  }
}

function mergeSources<T extends { text: string; score: number; fileName?: string; page?: number }>(
  sources: T[]
): T[] {
  const byKey = new Map<string, T>();

  for (const source of sources) {
    const key = `${source.fileName || 'unknown'}:${source.page || 'unknown'}:${source.text.slice(0, 160)}`;
    const existing = byKey.get(key);

    if (!existing || source.score > existing.score) {
      byKey.set(key, source);
    }
  }

  return [...byKey.values()].sort((left, right) => right.score - left.score);
}
