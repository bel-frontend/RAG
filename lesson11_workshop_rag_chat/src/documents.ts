import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { Document } from '@langchain/core/documents';
import { config } from './config';
import { loadPdfWithOcr } from './ocr';

export interface PdfFile {
  path: string;
  fileName: string;
}

export async function listPdfFiles(directory = config.pdfDir): Promise<PdfFile[]> {
  const stat = await fs.stat(directory).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new Error(`PDF directory does not exist: ${directory}`);
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
    .map((entry) => ({
      fileName: entry.name,
      path: path.join(directory, entry.name),
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

export async function loadPdfDocuments(directory = config.pdfDir): Promise<Document[]> {
  const files = await listPdfFiles(directory);
  const documents = await Promise.all(files.map((file) => loadPdfFile(file.path)));

  return documents.flat();
}

export async function loadPdfFile(filePath: string): Promise<Document[]> {
  const loader = new PDFLoader(filePath);
  const documents = await loader.load();
  const loadedDocuments = documents.length > 0 ? documents : await loadPdfWithOcr(filePath);

  return loadedDocuments.map((document) => ({
    ...document,
    metadata: normalizeMetadata({
      ...document.metadata,
      source: filePath,
    }),
  }));
}

export async function splitDocuments(documents: Document[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunks.size,
    chunkOverlap: config.chunks.overlap,
  });

  const chunks = await splitter.splitDocuments(documents);

  return chunks.map((chunk) => ({
    ...chunk,
    metadata: normalizeMetadata(chunk.metadata),
  }));
}

function normalizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const source = typeof metadata.source === 'string' ? metadata.source : '';

  return {
    ...metadata,
    source,
    fileName: source ? path.basename(source) : 'unknown.pdf',
  };
}
