import path from 'node:path';
import { config } from './config';
import { listPdfFiles, loadPdfFile, splitDocuments } from './documents';

const args = process.argv.slice(2);
const fileFilter = args.join(' ').trim();
const files = await listPdfFiles();
const selectedFiles = fileFilter
  ? files.filter((file) => file.fileName.toLowerCase().includes(fileFilter.toLowerCase()))
  : files;

if (selectedFiles.length === 0) {
  console.error(`No PDF files matched: ${fileFilter}`);
  process.exit(1);
}

for (const file of selectedFiles) {
  console.log(`\n${file.fileName}`);
  console.log('-'.repeat(file.fileName.length));

  const documents = await loadPdfFile(file.path);
  const chunks = await splitDocuments(documents);
  const pageLengths = documents.map((document) => document.pageContent.trim().length);
  const totalChars = pageLengths.reduce((total, length) => total + length, 0);
  const emptyPages = pageLengths.filter((length) => length === 0).length;
  const shortPages = pageLengths.filter((length) => length > 0 && length < 100).length;

  console.log(`Path: ${path.relative(config.lessonRoot, file.path)}`);
  console.log(`Pages loaded: ${documents.length}`);
  console.log(`Chunks prepared: ${chunks.length}`);
  console.log(`Total chars: ${totalChars}`);
  console.log(`Average chars/page: ${documents.length ? Math.round(totalChars / documents.length) : 0}`);
  console.log(`Empty pages: ${emptyPages}`);
  console.log(`Short pages (<100 chars): ${shortPages}`);
  console.log(`Chunk size: ${config.chunks.size}`);
  console.log(`Chunk overlap: ${config.chunks.overlap}`);

  const weakestPages = pageLengths
    .map((length, index) => ({ page: index + 1, length }))
    .sort((left, right) => left.length - right.length)
    .slice(0, 12);

  console.log('Shortest pages:');
  for (const page of weakestPages) {
    console.log(`- page ${String(page.page).padStart(3)}: ${page.length} chars`);
  }
}
