export interface RetrievedSource {
  text: string;
  score: number;
  source?: string;
  fileName?: string;
  page?: number;
}

export interface RagAnswer {
  answer: string;
  sources: RetrievedSource[];
}
