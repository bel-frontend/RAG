import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Model } from '../../common/model';

const lessonRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(lessonRoot, '..');

dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(lessonRoot, '.env'), override: true });

function numberFromEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number. Received: ${value}`);
  }

  return parsed;
}

function resolveFromLessonRoot(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(lessonRoot, value);
}

export const config = {
  lessonRoot,
  pdfDir: resolveFromLessonRoot(process.env.PDF_DIR || './pdf_documents'),
  qdrant: {
    url: (process.env.QDRANT_URL || '').replace(/\/$/, ''),
    apiKey: process.env.QDRANT_API_KEY,
    collection: process.env.QDRANT_COLLECTION || 'lesson11_pdf_documents',
  },
  embeddings: {
    model: process.env.EMBEDDINGS_MODEL || 'text-embedding-3-large',
    dimensions: numberFromEnv('EMBEDDINGS_DIM', 3072),
  },
  chat: {
    model: process.env.CHAT_MODEL || Model.GPT5_4,
    ollamaUrl: process.env.OLLAMA_BASE_URL,
  },
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: numberFromEnv('SERVER_PORT', 3001),
    topK: numberFromEnv('TOP_K', 5),
  },
  search: {
    minScore: numberFromEnv('RAG_MIN_SCORE', 0.25),
    folkWisdomTopK: numberFromEnv('FOLK_WISDOM_TOP_K', 30),
    dialectDictionaryTopK: numberFromEnv('DIALECT_DICTIONARY_TOP_K', 20),
    dialectDictionaryFile: process.env.DIALECT_DICTIONARY_FILE || 'Vusacki_slovazbor',
    sectionBackwardPages: numberFromEnv('SECTION_BACKWARD_PAGES', 1),
    sectionForwardPages: numberFromEnv('SECTION_FORWARD_PAGES', 12),
    sectionMaxChunks: numberFromEnv('SECTION_MAX_CHUNKS', 60),
    sectionTocPageOffset: numberFromEnv('SECTION_TOC_PAGE_OFFSET', 1),
  },
  chunks: {
    size: numberFromEnv('CHUNK_SIZE', 1000),
    overlap: numberFromEnv('CHUNK_OVERLAP', 200),
  },
  ocr: {
    enabled: process.env.OCR_ENABLED !== 'false',
    lang: process.env.OCR_LANG || 'bel+rus+eng',
    dpi: numberFromEnv('OCR_DPI', 200),
  },
};
