export interface RetrievedSource {
  text: string;
  score: number;
  source?: string;
  fileName?: string;
  page?: number;
  matchedQueries?: string[];
}

export interface RagAnswer {
  answer: string;
  sources: RetrievedSource[];
}
