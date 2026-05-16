import { config } from './config';
import { listPdfFiles } from './documents';
import { createQdrantClient } from './qdrant';

const qdrant = createQdrantClient();
const expectedFiles = await listPdfFiles();
const collections = await qdrant.listCollections();

if (!collections.includes(config.qdrant.collection)) {
  console.log(`Configured collection does not exist: ${config.qdrant.collection}`);
  console.log('Available collections:');
  for (const collection of collections) {
    console.log(`- ${collection}`);
  }
  process.exit(1);
}

const pointCount = await qdrant.count(config.qdrant.collection);
const indexedFiles = await collectIndexedFiles();
console.log(`Collection: ${config.qdrant.collection}`);
console.log(`Total points in Qdrant: ${pointCount}`);
console.log(`PDF files in folder: ${expectedFiles.length}`);

for (const file of expectedFiles) {
  const indexedCount = indexedFiles.get(file.fileName) || 0;
  const status = indexedCount > 0 ? 'indexed' : 'missing';
  console.log(`${status.padEnd(8)} ${String(indexedCount).padStart(5)} chunks  ${file.fileName}`);
}

const unknownFiles = [...indexedFiles.keys()].filter(
  (fileName) => !expectedFiles.some((file) => file.fileName === fileName)
);

if (unknownFiles.length > 0) {
  console.log('\nIndexed files not present in pdf_documents:');
  for (const fileName of unknownFiles) {
    console.log(`indexed ${String(indexedFiles.get(fileName)).padStart(5)} chunks  ${fileName}`);
  }
}

async function collectIndexedFiles(): Promise<Map<string, number>> {
  const files = new Map<string, number>();
  let offset: string | number | undefined;

  do {
    const page = await qdrant.scrollPayloads(config.qdrant.collection, 256, offset);

    for (const point of page.points) {
      const fileName = typeof point.payload?.fileName === 'string' ? point.payload.fileName : 'unknown';
      files.set(fileName, (files.get(fileName) || 0) + 1);
    }

    offset = page.nextOffset;
  } while (offset);

  return files;
}
