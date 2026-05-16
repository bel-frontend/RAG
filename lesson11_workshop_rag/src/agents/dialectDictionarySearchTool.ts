import { config } from '../config';
import type { HybridRetriever } from '../rag/hybridRetriever';
import { fallbackPlan } from './queryPlannerAgent';
import type { RagSearchOutput, SearchPlan } from './schemas';

const DIALECT_HINTS = [
  'Вушацкі словазбор',
  'Рыгор Барадулін',
  'слова',
  'слоўнік',
  'тлумачэнне',
  'значэнне',
  'прыклад',
  'вушацкі',
  'вушацкая гаворка',
  'дыялект',
  'мясцовае слова',
  'народная мова',
];

const SEMANTIC_EXPANSIONS: Array<[RegExp, string[]]> = [
  [/(праклен|праклен|праклен|праклён|праклены|праклёны|лаянк|клят|гразьб)/i, ['Праклёны й гразьбы', 'гразьбы', 'лаянка', 'кляцьба', 'бажанне ліха', 'каб цябе', 'бадай', 'халера']],
  [/(абраз|зняваг|лаянк)/i, ['абраза', 'знявага', 'лаянка', 'сварка']],
  [/(прывітан|вітан)/i, ['прывітанне', 'вітацца', 'здароўе', 'добры дзень']],
  [/(ежа|страва|харч|кух)/i, ['ежа', 'страва', 'харч', 'кухня', 'есці']],
  [/(надвор|пагод|дождж|снег|вецер)/i, ['надвор’е', 'пагода', 'дождж', 'снег', 'вецер']],
];

export class DialectDictionarySearchTool {
  readonly name = 'dialect_dictionary_search' as const;

  readonly description =
    'Searches only the Vusacki Slovazbor / Ryhor Baradulin dialect dictionary for words, meanings, examples, sections, curses, sayings, and local expressions.';

  constructor(private readonly retriever: HybridRetriever) {}

  async invoke(query: string): Promise<RagSearchOutput> {
    return this.invokePlan(fallbackPlan(query, 'dialect_dictionary_search'));
  }

  async invokePlan(plan: SearchPlan): Promise<RagSearchOutput> {
    if (!config.qdrant.url) {
      throw new Error('QDRANT_URL is required for dialect_dictionary_search');
    }

    const queries = buildDialectQueries(plan);
    const searchResults = await Promise.all(
      queries.map((searchQuery) =>
        this.retriever.retrieve(searchQuery, config.search.dialectDictionaryTopK, {
          fileNameIncludes: config.search.dialectDictionaryFile,
        })
      )
    );
    const rankedSources = boostExactMatches(mergeSources(searchResults.flat()), plan);
    const sources = rankedSources.slice(0, config.search.dialectDictionaryTopK);
    const sectionSources = shouldExpandSection(plan)
      ? await this.expandSection(rankedSources, plan)
      : [];
    const finalSources = sectionSources.length > 0 ? sectionSources : sources;

    return {
      query: queries.join(' | '),
      found: finalSources.length > 0,
      sources: finalSources,
      sourceCount: finalSources.length,
    };
  }

  private async expandSection(
    rankedSources: Array<{ text: string; score: number; fileName?: string; page?: number }>,
    plan: SearchPlan
  ): Promise<RagSearchOutput['sources']> {
    const tocRange = resolveSectionRangeFromTableOfContents(rankedSources, plan);
    if (tocRange) {
      return this.retriever.retrievePageRange({
        fileNameIncludes: config.search.dialectDictionaryFile,
        startPage: tocRange.startPage,
        endPage: tocRange.endPage,
        limit: config.search.sectionMaxChunks,
      });
    }

    const anchorSource = chooseSectionAnchor(rankedSources, plan);
    if (!anchorSource) {
      return [];
    }

    return this.retriever.retrieveAdjacent({
      anchor: anchorSource,
      fileNameIncludes: config.search.dialectDictionaryFile,
      backwardPages: config.search.sectionBackwardPages,
      forwardPages: config.search.sectionForwardPages,
      limit: config.search.sectionMaxChunks,
    });
  }
}

function shouldExpandSection(plan: SearchPlan): boolean {
  const query = `${plan.coreQuery} ${plan.expandedQueries.join(' ')}`;
  return plan.intent === 'dialect_section_lookup'
    || /(раздзел|спіс|усе|увесь|цалкам|далей|працяг|устойлів[\p{L}]*\s+выраз|прыкмет|звыча|страв|лекаван|section|list|all)/iu.test(query);
}

function chooseSectionAnchor<T extends { text: string; score: number; page?: number }>(
  sources: T[],
  plan: SearchPlan
): T | undefined {
  const queryTerms = normalizedTerms(plan.coreQuery);
  const scored = sources.map((source) => ({
    source,
    score: source.score + sectionAnchorScore(source.text, queryTerms),
  }));

  return scored
    .filter((item) => !looksLikeTableOfContents(item.source.text))
    .filter((item) => !looksLikeBackMatter(item.source.text))
    .filter((item) => sectionAnchorScore(item.source.text, queryTerms) > 0)
    .sort((left, right) => right.score - left.score)[0]?.source;
}

function resolveSectionRangeFromTableOfContents<T extends { text: string; page?: number }>(
  sources: T[],
  plan: SearchPlan
): { startPage: number; endPage: number } | undefined {
  const queryTerms = normalizedTerms(plan.coreQuery);
  if (queryTerms.length === 0) return undefined;

  for (const source of sources) {
    if (!looksLikeTableOfContents(source.text)) {
      continue;
    }

    const printedRange = findTocPrintedRange(source.text, queryTerms);
    if (printedRange) {
      const startPage = Math.max(1, printedRange.startPage + config.search.sectionTocPageOffset);
      const fallbackEndPage = startPage + config.search.sectionForwardPages;
      const endPage = printedRange.nextStartPage
        ? Math.max(startPage, printedRange.nextStartPage + config.search.sectionTocPageOffset - 1)
        : fallbackEndPage;

      return {
        startPage,
        endPage,
      };
    }
  }

  return undefined;
}

function findTocPrintedRange(
  text: string,
  queryTerms: string[]
): { startPage: number; nextStartPage?: number } | undefined {
  const normalized = normalizeText(text);
  const queryIndex = findBestQueryIndex(normalized, queryTerms);
  if (queryIndex < 0) return undefined;

  const window = normalized.slice(queryIndex, queryIndex + 260);
  const pageNumbers = [...window.matchAll(/\b(\d{2,4})\b/g)]
    .map((match) => Number(match[1]))
    .filter((value) => value > 0);

  if (!pageNumbers[0]) return undefined;

  return {
    startPage: pageNumbers[0],
    nextStartPage: pageNumbers.find((value) => value > pageNumbers[0]),
  };
}

function findBestQueryIndex(text: string, queryTerms: string[]): number {
  const indexes = queryTerms
    .map((term) => text.indexOf(term))
    .filter((index) => index >= 0);

  return indexes.length > 0 ? Math.min(...indexes) : -1;
}

function sectionAnchorScore(text: string, queryTerms: string[]): number {
  const normalized = normalizeText(text);
  const firstLine = normalizeText(text.split('\n').find((line) => line.trim().length > 0) || '');
  let score = 0;

  for (const term of queryTerms) {
    if (firstLine.includes(term)) score += 4;
    if (normalized.slice(0, 240).includes(term)) score += 2;
    if (normalized.includes(term)) score += 0.5;
  }

  return score;
}

function looksLikeTableOfContents(text: string): boolean {
  const normalized = normalizeText(text);
  const dottedLines = (text.match(/\.{4,}|нннн|ssss|_{4,}/gi) || []).length;
  const sectionLikeWords = ['параунан', 'прыказк', 'каляндар', 'звыча', 'прыкмет', 'страв', 'лекаван'];
  const sectionHits = sectionLikeWords.filter((word) => normalized.includes(word)).length;

  return dottedLines >= 2 || sectionHits >= 4;
}

function looksLikeBackMatter(text: string): boolean {
  const normalized = normalizeText(text);
  return normalized.includes('isbn') || normalized.includes('пад адной вокладкай');
}

function normalizedTerms(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .filter((term) => term.length >= 4);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ё]/g, 'е')
    .replace(/[ў]/g, 'у')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function boostExactMatches<T extends { text: string; score: number }>(sources: T[], plan: SearchPlan): T[] {
  const terms = [...new Set(plan.expandedQueries.join(' ').toLowerCase().split(/\s+/))]
    .map((term) => term.replace(/[^\p{L}\p{N}]+/gu, ''))
    .filter((term) => term.length >= 4);

  return sources
    .map((source) => {
      const text = source.text.toLowerCase();
      const hits = terms.filter((term) => text.includes(term)).length;

      return {
        ...source,
        score: source.score + hits * 0.15,
      };
    })
    .sort((left, right) => right.score - left.score);
}

function buildDialectQueries(plan: SearchPlan): string[] {
  const query = plan.coreQuery;
  const expansions = SEMANTIC_EXPANSIONS.flatMap(([pattern, terms]) =>
    pattern.test(`${query} ${plan.expandedQueries.join(' ')}`) ? terms : []
  );

  return [...new Set([
    ...plan.expandedQueries,
    `${query} ${DIALECT_HINTS.join(' ')}`,
    ...expansions.map((term) => `${query} ${term}`),
    ...expansions,
  ].filter(Boolean))].slice(0, 14);
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
