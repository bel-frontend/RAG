import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { config } from './config';

const execFileAsync = promisify(execFile);

const inputArg = process.argv[2];
if (!inputArg) {
  console.error('Usage: bun run ocr:pdf -- pdf_documents/book.pdf');
  process.exit(1);
}

const inputPath = path.isAbsolute(inputArg) ? inputArg : path.resolve(config.lessonRoot, inputArg);
const inputName = path.basename(inputPath, path.extname(inputPath));
const outputDir = path.resolve(config.lessonRoot, 'ocr_documents');
const workDir = path.join(outputDir, `.work-${inputName}`);
const outputPath = path.join(outputDir, `${inputName}.ocr.pdf`);

await assertCommand('pdftoppm');
await assertCommand('tesseract');
await assertCommand('pdfunite');
await fs.mkdir(outputDir, { recursive: true });
await fs.rm(workDir, { recursive: true, force: true });
await fs.mkdir(workDir, { recursive: true });

console.log(`Input: ${inputPath}`);
console.log(`Output: ${outputPath}`);
console.log(`OCR language: ${config.ocr.lang}`);
console.log(`DPI: ${config.ocr.dpi}`);

try {
  const imagePrefix = path.join(workDir, 'page');
  console.log('Rendering PDF pages to PNG...');
  await execFileAsync('pdftoppm', ['-png', '-r', String(config.ocr.dpi), inputPath, imagePrefix], {
    maxBuffer: 20 * 1024 * 1024,
  });

  const imageFiles = (await fs.readdir(workDir))
    .filter((fileName) => fileName.endsWith('.png'))
    .sort()
    .map((fileName) => path.join(workDir, fileName));

  if (imageFiles.length === 0) {
    throw new Error('pdftoppm produced no page images.');
  }

  console.log(`Rendered ${imageFiles.length} pages.`);

  const pagePdfs: string[] = [];
  for (const [index, imageFile] of imageFiles.entries()) {
    const pageNumber = index + 1;
    const outputBase = path.join(workDir, `ocr-page-${String(pageNumber).padStart(4, '0')}`);

    console.log(`OCR page ${pageNumber}/${imageFiles.length}`);
    await execFileAsync('tesseract', [imageFile, outputBase, '-l', config.ocr.lang, '--psm', '6', 'pdf'], {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 180_000,
    });

    pagePdfs.push(`${outputBase}.pdf`);
  }

  console.log('Merging OCR pages...');
  await execFileAsync('pdfunite', [...pagePdfs, outputPath], {
    maxBuffer: 20 * 1024 * 1024,
  });

  const extractedChars = await countExtractableChars(outputPath);
  console.log(`Created OCR PDF: ${outputPath}`);
  console.log(`Extractable characters check: ${extractedChars}`);
} finally {
  await fs.rm(workDir, { recursive: true, force: true });
}

async function assertCommand(command: string): Promise<void> {
  try {
    await execFileAsync('which', [command]);
  } catch {
    throw new Error(`Required command is missing: ${command}`);
  }
}

async function countExtractableChars(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('pdftotext', [filePath, '-'], {
      maxBuffer: 50 * 1024 * 1024,
    });

    return stdout.replace(/\s+/g, '').length;
  } catch {
    return 0;
  }
}
