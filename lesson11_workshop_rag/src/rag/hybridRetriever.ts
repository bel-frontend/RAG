import { config } from '../config';
import type { RetrievedSource } from './types';
import type { LexicalRetriever } from './lexicalRetriever';
import type { QdrantRetriever } from './retriever';

export interface HybridRetrieveOptions {
  fileNameIncludes?: string;
}

export class HybridRetriever {
  constructor(
    private readonly vectorRetriever: QdrantRetriever,
    private readonly lexicalRetriever: LexicalRetriever
  ) {}

  async retrieve(
    query: string,
    limit = config.server.topK,
    options?: HybridRetrieveOptions
  ): Promise<RetrievedSource[]> {
    const [vectorSources, lexicalSources] = await Promise.allSettled([
      this.vectorRetriever.retrieve(query, limit),
      this.lexicalRetriever.retrieve(query, limit, options),
    ]);

    const merged = mergeSources([
      ...(vectorSources.status === 'fulfilled' ? vectorSources.value : []),
      ...(lexicalSources.status === 'fulfilled' ? lexicalSources.value : []),
    ]).filter((source) => matchesSourceFile(source, options?.fileNameIncludes));

    if (vectorSources.status === 'rejected') {
      console.warn(`Vector retrieval failed: ${vectorSources.reason}`);
    }

    return merged.slice(0, limit);
  }

  async retrievePageRange(options: {
    fileNameIncludes: string;
    startPage: number;
    endPage: number;
    limit: number;
  }): Promise<RetrievedSource[]> {
    return this.lexicalRetriever.retrievePageRange(options);
  }

  async retrieveAdjacent(options: {
    anchor: RetrievedSource;
    fileNameIncludes: string;
    forwardPages: number;
    backwardPages: number;
    limit: number;
  }): Promise<RetrievedSource[]> {
    return this.lexicalRetriever.retrieveAdjacent(options);
  }
}

function matchesSourceFile(source: RetrievedSource, fileNameIncludes?: string): boolean {
  if (!fileNameIncludes) return true;
  return (source.fileName || '').toLowerCase().includes(fileNameIncludes.toLowerCase());
}

function mergeSources(sources: RetrievedSource[]): RetrievedSource[] {
  const byKey = new Map<string, RetrievedSource>();

  for (const source of sources) {
    const key = `${source.fileName || 'unknown'}:${source.page || 'unknown'}:${source.text.slice(0, 160)}`;
    const existing = byKey.get(key);

    if (!existing || source.score > existing.score) {
      byKey.set(key, source);
    }
  }

  return [...byKey.values()].sort((left, right) => right.score - left.score);
}
