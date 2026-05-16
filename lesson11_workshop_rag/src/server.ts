import { config } from './config';
import { createEmbeddings } from './embeddings';
import { ChatOrchestratorAgent } from './agents/chatOrchestrator';
import { DialectDictionarySearchTool } from './agents/dialectDictionarySearchTool';
import { FolkWisdomSearchTool } from './agents/folkWisdomSearchTool';
import { RagSearchAgent } from './agents/ragSearchAgent';
import { ChatRequestSchema, type ChatMessage } from './agents/schemas';
import { QdrantClient } from './qdrant/client';
import { HybridRetriever } from './rag/hybridRetriever';
import { LexicalRetriever } from './rag/lexicalRetriever';
import { QdrantRetriever } from './rag/retriever';

const qdrant = new QdrantClient(config.qdrant.url || 'http://missing-qdrant-url', config.qdrant.apiKey);
const retriever = new HybridRetriever(
  new QdrantRetriever(qdrant, createEmbeddings()),
  new LexicalRetriever(qdrant)
);
const chatAgent = new ChatOrchestratorAgent(
  new RagSearchAgent(retriever),
  new FolkWisdomSearchTool(retriever),
  new DialectDictionarySearchTool(retriever)
);

const server = Bun.serve({
  hostname: config.server.host,
  port: config.server.port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return emptyResponse();
    }

    if (url.pathname === '/api/health') {
      return jsonResponse({
        ok: true,
        qdrantConfigured: Boolean(config.qdrant.url),
        collection: config.qdrant.collection,
        chatModel: config.chat.model,
        agents: ['chat-orchestrator', 'rag-search'],
        tools: ['folk_wisdom_search', 'dialect_dictionary_search'],
      });
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
});

console.log(`RAG server is running at http://${server.hostname}:${server.port}`);

async function handleChat(request: Request): Promise<Response> {
  try {
    const body = ChatRequestSchema.parse(await request.json());
    const messages = normalizeMessages(body);

    if (messages.length === 0) {
      return jsonResponse({ error: 'messages or question is required' }, 400);
    }

    const result = await chatAgent.chat(messages);
    return jsonResponse(result);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
}

function normalizeMessages(body: { question?: string; messages?: ChatMessage[] }): ChatMessage[] {
  if (body.messages?.length) {
    return body.messages.map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
  }

  const question = body.question?.trim();
  return question ? [{ role: 'user', content: question }] : [];
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, {
    status,
    headers: corsHeaders(),
  });
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
