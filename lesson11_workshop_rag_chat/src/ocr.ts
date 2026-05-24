import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Document } from '@langchain/core/documents';
import { config } from './config';

const execFileAsync = promisify(execFile);

export async function loadPdfWithOcr(filePath: string): Promise<Document[]> {
  if (!config.ocr.enabled) {
    return [];
  }

  await assertCommand('pdftoppm');
  await assertCommand('tesseract');

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lesson11-ocr-'));
  const outputPrefix = path.join(workDir, 'page');

  try {
    await execFileAsync('pdftoppm', [
      '-png',
      '-r',
      String(config.ocr.dpi),
      filePath,
      outputPrefix,
    ]);

    const imageFiles = (await fs.readdir(workDir))
      .filter((fileName) => fileName.endsWith('.png'))
      .sort()
      .map((fileName) => path.join(workDir, fileName));

    const documents: Document[] = [];

    for (const [index, imageFile] of imageFiles.entries()) {
      const { stdout } = await execFileAsync(
        'tesseract',
        [imageFile, 'stdout', '-l', config.ocr.lang, '--psm', '6'],
        {
          maxBuffer: 20 * 1024 * 1024,
          timeout: 180_000,
        }
      );
      const text = stdout.trim();

      if (text.length > 0) {
        documents.push({
          pageContent: text,
          metadata: {
            source: filePath,
            ocr: true,
            loc: {
              pageNumber: index + 1,
            },
          },
        });
      }
    }

    return documents;
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

async function assertCommand(command: string): Promise<void> {
  try {
    await execFileAsync('which', [command]);
  } catch {
    throw new Error(
      `OCR fallback needs "${command}" installed and available in PATH. Disable with OCR_ENABLED=false.`
    );
  }
}
