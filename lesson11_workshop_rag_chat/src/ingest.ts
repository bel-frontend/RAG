import { v4 as uuidv4 } from 'uuid';
import type { Document } from '@langchain/core/documents';
import { config } from './config';
import { listPdfFiles, loadPdfFile, splitDocuments, type PdfFile } from './documents';
import { createEmbeddings } from './embeddings';
import { createReport, writeReport, type IngestFileReport } from './ingestReport';
import { createQdrantClient } from './qdrant';
import type { QdrantPoint } from './qdrant/client';

const BATCH_SIZE = 64;

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  console.log(`PDF directory: ${config.pdfDir}`);
  console.log(`Qdrant collection: ${config.qdrant.collection}`);
  console.log(`Embeddings model: ${config.embeddings.model}`);
  console.log(`Expected embeddings dimension: ${config.embeddings.dimensions}`);

  const pdfFiles = await listPdfFiles();
  if (pdfFiles.length === 0) {
    console.log('No PDF pages were loaded. Add .pdf files to pdf_documents and run ingest again.');
    return;
  }

  console.log(`Found ${pdfFiles.length} PDF files:`);
  pdfFiles.forEach((file) => console.log(`- ${file.fileName}`));

  const qdrant = createQdrantClient();
  await qdrant.ensureCollection(config.qdrant.collection, config.embeddings.dimensions);
  console.log('Collection is ready.');

  const embeddings = createEmbeddings();
  const fileReports: IngestFileReport[] = [];

  for (const pdfFile of pdfFiles) {
    fileReports.push(await ingestPdfFile(pdfFile, embeddings, qdrant));
  }

  const report = createReport(fileReports, startedAt);
  const reportPath = await writeReport(report);

  console.log(`Ingestion report: ${reportPath}`);
  console.log(
    `Ingestion finished: ${report.filesInserted}/${report.filesTotal} files inserted, ${report.filesFailed} failed, ${report.pointsInserted} points inserted.`
  );

  if (report.filesFailed > 0) {
    throw new Error('Some PDF files failed ingestion. See reports/ingest-report.json');
  }
}

async function ingestPdfFile(
  pdfFile: PdfFile,
  embeddings: ReturnType<typeof createEmbeddings>,
  qdrant: ReturnType<typeof createQdrantClient>
): Promise<IngestFileReport> {
  console.log(`\nProcessing ${pdfFile.fileName}...`);

  try {
    const rawDocuments = await loadPdfFile(pdfFile.path);
    console.log(`Loaded ${rawDocuments.length} PDF page documents from ${pdfFile.fileName}.`);
    if (rawDocuments.some((document) => document.metadata.ocr === true)) {
      console.log(`OCR fallback was used for ${pdfFile.fileName}.`);
    }
    if (rawDocuments.length === 0) {
      throw new Error(
        'PDF loader returned 0 pages and OCR fallback produced no text. The file may be encrypted, malformed, or OCR languages may be misconfigured.'
      );
    }

    const chunks = await splitDocuments(rawDocuments);
    console.log(`Prepared ${chunks.length} text chunks from ${pdfFile.fileName}.`);
    if (chunks.length === 0) {
      throw new Error('Text splitter returned 0 chunks. The PDF likely contains no extractable text.');
    }

    let inserted = 0;
    for (let start = 0; start < chunks.length; start += BATCH_SIZE) {
      const batch = chunks.slice(start, start + BATCH_SIZE);
      const batchNumber = Math.floor(start / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

      console.log(
        `Embedding ${pdfFile.fileName} batch ${batchNumber}/${totalBatches} (${batch.length} chunks)...`
      );
      const vectors = await embeddings.embedDocuments(batch.map((doc) => doc.pageContent));
      validateVectors(vectors, batch.length);

      const points = buildPoints(batch, vectors);
      await qdrant.upsertPoints(config.qdrant.collection, points);

      inserted += points.length;
      console.log(`Inserted ${inserted} of ${chunks.length} chunks from ${pdfFile.fileName}`);
    }

    return {
      fileName: pdfFile.fileName,
      status: 'inserted',
      pagesLoaded: rawDocuments.length,
      chunksPrepared: chunks.length,
      pointsInserted: inserted,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ingestion error';
    console.error(`Failed to ingest ${pdfFile.fileName}: ${message}`);

    return {
      fileName: pdfFile.fileName,
      status: 'failed',
      pagesLoaded: 0,
      chunksPrepared: 0,
      pointsInserted: 0,
      error: message,
    };
  }
}

function validateVectors(vectors: number[][], expectedCount: number): void {
  if (vectors.length !== expectedCount) {
    throw new Error(`Embeddings count mismatch: expected ${expectedCount}, got ${vectors.length}`);
  }

  const invalidVector = vectors.find((vector) => vector.length !== config.embeddings.dimensions);
  if (invalidVector) {
    throw new Error(
      `Embedding dimension mismatch: expected ${config.embeddings.dimensions}, got ${invalidVector.length}`
    );
  }
}

function buildPoints(documents: Document[], vectors: number[][]): QdrantPoint[] {
  return documents.map((doc, index) => ({
    id: uuidv4(),
    vector: vectors[index],
    payload: {
      ...doc.metadata,
      text: doc.pageContent,
    },
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
