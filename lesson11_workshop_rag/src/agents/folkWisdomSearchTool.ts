import { config } from '../config';
import type { HybridRetriever } from '../rag/hybridRetriever';
import { fallbackPlan } from './queryPlannerAgent';
import type { RagSearchOutput, SearchPlan } from './schemas';

const FOLK_WISDOM_HINTS = [
  'прыказка',
  'прыказкі',
  'прымаўка',
  'прымаўкі',
  'народная мудрасць',
  'народныя мудрасці',
  'прыслоўе',
  'прыслоўі',
  'выслоўе',
  'выслоўі',
  'proverb',
  'proverbs',
  'saying',
  'sayings',
  'folk wisdom',
];

export class FolkWisdomSearchTool {
  readonly name = 'folk_wisdom_search' as const;

  readonly description =
    'Searches the indexed PDF collection specifically for proverbs, sayings, aphorisms, and other folk wisdom.';

  constructor(private readonly retriever: HybridRetriever) {}

  async invoke(query: string): Promise<RagSearchOutput> {
    return this.invokePlan(fallbackPlan(query, 'folk_wisdom_search'));
  }

  async invokePlan(plan: SearchPlan): Promise<RagSearchOutput> {
    if (!config.qdrant.url) {
      throw new Error('QDRANT_URL is required for folk_wisdom_search');
    }

    const queries = buildFolkWisdomQueries(plan);
    const searchResults = await Promise.all(
      queries.map((searchQuery) => this.retriever.retrieve(searchQuery, config.search.folkWisdomTopK))
    );
    const sources = mergeSources(searchResults.flat()).slice(0, config.search.folkWisdomTopK);

    return {
      query: queries.join(' | '),
      found: sources.length > 0,
      sources,
      sourceCount: sources.length,
    };
  }
}

function buildFolkWisdomQueries(plan: SearchPlan): string[] {
  return [...new Set([
    ...plan.expandedQueries,
    `${plan.coreQuery} прыказкі прымаўкі`,
    `${plan.coreQuery} народная мудрасць выслоўі`,
    `${plan.coreQuery} proverbs sayings folk wisdom`,
    FOLK_WISDOM_HINTS.join(' '),
  ])].slice(0, 12);
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
