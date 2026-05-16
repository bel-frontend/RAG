export interface RetrievedSource {
  text: string;
  score: number;
  source?: string;
  fileName?: string;
  page?: number;
}

export interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  answer: string;
  usedRag: boolean;
  searchQuery?: string;
  sources: RetrievedSource[];
  trace: {
    orchestratorDecision: {
      action: 'answer_directly' | 'search_rag' | 'search_folk_wisdom' | 'search_dialect_dictionary';
      searchQuery?: string;
      directAnswer?: string;
      reason: string;
    };
    usedTool: 'chat' | 'rag_search' | 'folk_wisdom_search' | 'dialect_dictionary_search';
    searchPlan?: {
      intent:
        | 'direct_chat'
        | 'general_rag'
        | 'folk_wisdom'
        | 'dialect_definition'
        | 'dialect_section_lookup'
        | 'exact_phrase';
      coreQuery: string;
      expandedQueries: string[];
      targetBook: 'any' | 'vushatski_slovazbor' | 'proverbs_dictionary';
      tool: 'chat' | 'rag_search' | 'folk_wisdom_search' | 'dialect_dictionary_search';
      reason: string;
    };
    citations: string[];
  };
}

export async function askChat(messages: ChatMessageInput[]): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  const text = await response.text();
  const data = parseJson(text);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  if (!data) {
    throw new Error('Server returned an empty response');
  }

  return data as ChatResponse;
}

function parseJson(text: string): Partial<ChatResponse> & { error?: string } {
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text,
    };
  }
}
