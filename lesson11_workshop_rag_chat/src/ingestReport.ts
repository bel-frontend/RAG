import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config';

export interface IngestFileReport {
  fileName: string;
  status: 'inserted' | 'failed';
  pagesLoaded: number;
  chunksPrepared: number;
  pointsInserted: number;
  error?: string;
}

export interface IngestReport {
  startedAt: string;
  finishedAt: string;
  collection: string;
  pdfDir: string;
  filesTotal: number;
  filesInserted: number;
  filesFailed: number;
  pagesLoaded: number;
  chunksPrepared: number;
  pointsInserted: number;
  files: IngestFileReport[];
}

export function createReport(files: IngestFileReport[], startedAt: string): IngestReport {
  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    collection: config.qdrant.collection,
    pdfDir: config.pdfDir,
    filesTotal: files.length,
    filesInserted: files.filter((file) => file.status === 'inserted').length,
    filesFailed: files.filter((file) => file.status === 'failed').length,
    pagesLoaded: sum(files, 'pagesLoaded'),
    chunksPrepared: sum(files, 'chunksPrepared'),
    pointsInserted: sum(files, 'pointsInserted'),
    files,
  };
}

export async function writeReport(report: IngestReport): Promise<string> {
  const reportDir = path.join(config.lessonRoot, 'reports');
  await fs.mkdir(reportDir, { recursive: true });

  const filePath = path.join(reportDir, 'ingest-report.json');
  await fs.writeFile(filePath, JSON.stringify(report, null, 2));

  return filePath;
}

function sum(files: IngestFileReport[], key: keyof IngestFileReport): number {
  return files.reduce((total, file) => {
    const value = file[key];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
}
