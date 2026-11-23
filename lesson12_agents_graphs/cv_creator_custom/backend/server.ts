import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

import { Command } from '@langchain/langgraph';

import { app, createConfig } from '../orchestrator.ts';

type GraphInput = Record<string, unknown> | Command;

type InterruptChunk = {
  __interrupt__?: Array<{ value: unknown }>;
};

const frontendDirectory = path.resolve(import.meta.dirname, '../frontend');
const port = Number(Bun.env.PORT ?? 3000);

const server = Bun.serve({
  hostname: '0.0.0.0',
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return jsonResponse({ ok: true });
    }

    if (url.pathname === '/api/cv/start' && request.method === 'POST') {
      return startCvSession(request);
    }

    if (url.pathname === '/api/cv/answer' && request.method === 'POST') {
      return answerCvQuestion(request);
    }

    if (request.method === 'GET') {
      return serveFrontend(url.pathname);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
});

console.log(`CV editor is running at http://${server.hostname}:${server.port}`);

async function startCvSession(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const candidateText = readRequiredString(body, 'candidateText');
    const vacancyText = readRequiredString(body, 'vacancyText');
    const threadId = randomUUID();

    return jsonResponse(
      await runGraph(
        {
          candidateText,
          vacancyText,
        },
        threadId
      )
    );
  } catch (error) {
    return errorResponse(error);
  }
}

async function answerCvQuestion(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const threadId = readRequiredString(body, 'threadId');
    const answer = readRequiredString(body, 'answer');

    return jsonResponse(await runGraph(new Command({ resume: answer }), threadId));
  } catch (error) {
    return errorResponse(error);
  }
}

async function runGraph(input: GraphInput, threadId: string) {
  const config = createConfig(threadId);
  let question: string | null = null;

  for await (const chunk of await app.stream(input, config)) {
    const interruptValue = (chunk as InterruptChunk).__interrupt__?.[0]?.value;

    if (typeof interruptValue === 'string') {
      question = interruptValue;
    }
  }

  const state = await app.getState(config);

  return {
    threadId,
    status: question ? 'needs_input' : 'completed',
    question,
    cv: state.values.cv ?? null,
  };
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const value = await request.json();

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  return value as Record<string, unknown>;
}

function readRequiredString(body: Record<string, unknown>, field: string): string {
  const value = body[field];

  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${field} is required`);
  }

  return value.trim();
}

function serveFrontend(pathname: string): Response {
  const files: Record<string, { name: string; type: string }> = {
    '/': { name: 'index.html', type: 'text/html; charset=utf-8' },
    '/index.html': { name: 'index.html', type: 'text/html; charset=utf-8' },
    '/app.js': { name: 'app.js', type: 'text/javascript; charset=utf-8' },
    '/styles.css': { name: 'styles.css', type: 'text/css; charset=utf-8' },
  };
  const asset = files[pathname];

  if (!asset) {
    return jsonResponse({ error: 'Not found' }, 404);
  }

  return new Response(Bun.file(path.join(frontendDirectory, asset.name)), {
    headers: { 'Content-Type': asset.type },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function errorResponse(error: unknown): Response {
  console.error(error);

  if (error instanceof HttpError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  return jsonResponse(
    { error: error instanceof Error ? error.message : 'Unexpected server error' },
    500
  );
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}
