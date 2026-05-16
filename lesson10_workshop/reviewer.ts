/**
 * 📄 MD-Рэцэнзент v2
 *
 * Палепшаны агент для праверкі Markdown файлаў
 *
 * Магчымасці:
 * - Рэжымы праверкі: grammar, style, full
 * - Паралельная апрацоўка вялікіх дакументаў
 * - Захаванне структуры і код-блокаў
 *
 * Выкарыстанне:
 *   bun run start <файл.md> [--mode=grammar|style|full] [--parallel]
 */

import { StateGraph, Annotation } from '@langchain/langgraph';
import { chatModel, Model } from '../common/model';
import { config } from 'dotenv';
import { resolve, basename, dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

config({ path: resolve(import.meta.dir, '.env') });

// ============================================
// 📋 Тыпы і канстанты
// ============================================

type ReviewMode = 'grammar' | 'style' | 'full';

interface DocumentChunk {
    id: number;
    content: string;
    startLine: number;
    endLine: number;
    type: 'header' | 'content' | 'code';
}

interface ChunkResult {
    id: number;
    original: string;
    reviewed: string;
    score: number;
    issues: string[];
}

interface ChangeLogEntry {
    iteration: number;
    chunkId: number;
    startLine: number;
    endLine: number;
    original: string;
    reviewed: string;
    summary: string[];
}

const CHUNK_SIZE = 3000; // Максімальны памер чанка ў сімвалах
const MAX_PARALLEL = 2; // Максімум паралельных запытаў (2 для стабільнасці)
const MAX_ITERATIONS = 2; // Абмежаванне, каб граф не сышоў у бясконцы цыкл

// ============================================
// 📊 Стан
// ============================================

const MDReviewState = Annotation.Root({
    filePath: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    originalContent: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    currentContent: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    mode: Annotation<ReviewMode>({
        reducer: (_, update) => update,
        default: () => 'full' as ReviewMode,
    }),
    useParallel: Annotation<boolean>({
        reducer: (_, update) => update,
        default: () => false,
    }),
    chunks: Annotation<DocumentChunk[]>({
        reducer: (_, update) => update,
        default: () => [],
    }),
    chunkResults: Annotation<ChunkResult[]>({
        reducer: (_, update) => update, // Замяняем, а не накапляем
        default: () => [],
    }),
    changeLog: Annotation<ChangeLogEntry[]>({
        reducer: (current, update) => current.concat(update),
        default: () => [],
    }),
    feedback: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    score: Annotation<number>({
        reducer: (_, update) => update,
        default: () => 0,
    }),
    approved: Annotation<boolean>({
        reducer: (_, update) => update,
        default: () => false,
    }),
    iteration: Annotation<number>({
        reducer: (_, update) => update,
        default: () => 0,
    }),
});

type MDReviewStateType = typeof MDReviewState.State;

const model = await chatModel(Model.GPT5_NANO);

// ============================================
// 🔧 Утыліты
// ============================================

function getModePrompt(mode: ReviewMode): string {
    const prompts: Record<ReviewMode, string> = {
        grammar: `Правер ТОЛЬКІ граматыку і правапіс:
- Арфаграфічныя памылкі
- Памылкі друку  
- Канчаткі слоў
- Склады і адмены

НЕ правярай стыль, структуру ці Markdown фарматаванне.`,

        style: `Правер ТОЛЬКІ стыль і яснасць:
- Зразумеласць тлумачэнняў
- Паслядоўнасць тэрміналогіі
- Структура сказаў
- Тон і рэгістр мовы

НЕ правярай арфаграфію ці Markdown фарматаванне.`,

        full: `Правер усё:

1. **ГРАМАТЫКА І ПРАВАПІС**
   - Правільнасць беларускіх слоў
   - Памылкі друку
   - Канчаткі слоў

2. **ПУНКТУАЦЫЯ**
   - Коскі, кропкі, двукроп'е
   - Працяжнікі і злучкі

3. **СТЫЛЬ І ЯСНАСЦЬ**
   - Зразумеласць тлумачэнняў
   - Паслядоўнасць тэрміналогіі

4. **MARKDOWN ФАРМАТАВАННЕ**
   - Правільнасць загалоўкаў
   - Фарматаванне кода
   - Спісы і табліцы`,
    };

    return prompts[mode];
}

function getModeEmoji(mode: ReviewMode): string {
    return { grammar: '📝', style: '✨', full: '🔍' }[mode];
}

function getModeName(mode: ReviewMode): string {
    return { grammar: 'Граматыка', style: 'Стыль', full: 'Поўная' }[mode];
}

// ============================================
// 📄 Разбіўка дакумента на часткі
// ============================================

function splitIntoChunks(content: string): DocumentChunk[] {
    const lines = content.split('\n');
    const chunks: DocumentChunk[] = [];

    let currentChunk: string[] = [];
    let currentType: 'header' | 'content' | 'code' = 'content';
    let chunkStartLine = 0;
    let inCodeBlock = false;
    let chunkId = 0;

    function saveChunk(endLine: number) {
        if (currentChunk.length > 0) {
            chunks.push({
                id: chunkId++,
                content: currentChunk.join('\n'),
                startLine: chunkStartLine,
                endLine: endLine,
                type: currentType,
            });
            currentChunk = [];
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Код-блокі захоўваем як асобныя чанкі
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                // Пачатак код-блока - захоўваем папярэдні чанк
                saveChunk(i - 1);
                chunkStartLine = i;
                currentType = 'code';
                inCodeBlock = true;
            } else {
                // Канец код-блока
                currentChunk.push(line);
                saveChunk(i);
                chunkStartLine = i + 1;
                currentType = 'content';
                inCodeBlock = false;
                continue;
            }
        }

        // Загалоўкі - новы чанк
        if (!inCodeBlock && line.match(/^#{1,3}\s+/)) {
            saveChunk(i - 1);
            chunkStartLine = i;
            currentType = 'header';
        }

        currentChunk.push(line);

        // Калі чанк занадта вялікі - разбіваем
        const chunkText = currentChunk.join('\n');
        if (!inCodeBlock && chunkText.length > CHUNK_SIZE) {
            // Шукаем добрае месца для разрыву (пусты радок)
            const lastEmpty = currentChunk.slice(0, -1).lastIndexOf('');
            if (lastEmpty > currentChunk.length / 2) {
                const overflow = currentChunk.splice(lastEmpty + 1);
                saveChunk(i - overflow.length);
                currentChunk = overflow;
                chunkStartLine = i - overflow.length + 1;
                currentType = 'content';
            }
        }
    }

    // Апошні чанк
    saveChunk(lines.length - 1);

    return chunks;
}

function mergeChunks(results: ChunkResult[]): string {
    // Сартуем па id і аб'ядноўваем
    const sorted = results.sort((a, b) => a.id - b.id);

    // Аб'ядноўваем з захаваннем пустых радкоў паміж секцыямі
    let merged = '';
    for (let i = 0; i < sorted.length; i++) {
        const chunk = sorted[i];
        if (
            i > 0 &&
            !merged.endsWith('\n\n') &&
            !chunk.reviewed.startsWith('\n')
        ) {
            merged += '\n';
        }
        merged += chunk.reviewed;
        if (i < sorted.length - 1 && !chunk.reviewed.endsWith('\n')) {
            merged += '\n';
        }
    }

    return merged.trim();
}

function summarizeChanges(original: string, reviewed: string): string[] {
    const summary: string[] = [];
    const originalLines = original.split('\n');
    const reviewedLines = reviewed.split('\n');

    if (original === reviewed) {
        return summary;
    }

    if (original.replace(/\s+/g, ' ') === reviewed.replace(/\s+/g, ' ')) {
        summary.push('Выпраўлены прабелы і пераносы радкоў без змены сэнсу.');
    }

    if (stripPunctuation(original) === stripPunctuation(reviewed)) {
        summary.push('Удакладнена пунктуацыя.');
    }

    if (original.replace(/-/g, '—') !== reviewed.replace(/-/g, '—')) {
        summary.push('Адрэдагаваны злучкі або працяжнікі.');
    }

    if (original.toLowerCase() === reviewed.toLowerCase()) {
        summary.push('Выпраўлены рэгістр літар.');
    }

    if (countMarkdownMarkers(original) !== countMarkdownMarkers(reviewed)) {
        summary.push('Зменена Markdown-фарматаванне.');
    }

    if (originalLines.length !== reviewedLines.length) {
        summary.push('Зменена структура радкоў або абзацаў.');
    }

    if (summary.length === 0) {
        summary.push(
            'Унесены моўныя або стылістычныя праўкі для лепшай чытальнасці.'
        );
    }

    return Array.from(new Set(summary));
}

function stripPunctuation(text: string): string {
    return text.replace(/[.,!?;:()[\]'"«»“”‘’—-]/g, '').replace(/\s+/g, ' ');
}

function countMarkdownMarkers(text: string): number {
    return (text.match(/[#*_`[\]()>|-]/g) || []).length;
}

// ============================================
// 📖 Рэцэнзент аднаго чанка
// ============================================

async function reviewChunk(
    chunk: DocumentChunk,
    mode: ReviewMode
): Promise<ChunkResult> {
    // Код-блокі не правяраем - вяртаем як ёсць
    if (chunk.type === 'code') {
        return {
            id: chunk.id,
            original: chunk.content,
            reviewed: chunk.content,
            score: 10,
            issues: [],
        };
    }

    const modePrompt = getModePrompt(mode);

    const response = await model.invoke([
        {
            role: 'system',
            content: `Ты рэдактар тэхнічнай дакументацыі на беларускай мове. Карыстальнік дасць табе тэкст, а ты вернеш яго выпраўленую версію.

${modePrompt}

⚠️ СТРОГІЯ ПРАВІЛЫ:
- Вяртай ТОЛЬКІ выпраўлены тэкст
- НІКОЛІ не дадавай каментары, уступы, тлумачэнні
- НІКОЛІ не паўтарай інструкцыі
- Захоўвай фарматаванне Markdown як ёсць
- Калі памылак няма - вярні ДАКЛАДНА такі ж тэкст`,
        },
        { role: 'user', content: chunk.content },
    ]);

    let reviewed = String(response.content)
        .replace(/^```(?:markdown)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

    // Выдаляем непажаданыя каментары і промпты ад мадэлі
    const unwantedPatterns = [
        /^Выправ наступны тэкст[^:]*:?\s*\n?/gim,
        /^Тэкст не зменены\.?\s*\n?/gim,
        /^Тэкст без зменаў\.?\s*\n?/gim,
        /^Без зменаў\.?\s*\n?/gim,
        /^Тэкст не прадстаўлены\.?\s*\n?/gim,
        /^Тэкст для праверкі не прадстаўлены\.?\s*\n?/gim,
        /^Выпраўлены тэкст:?\s*\n?/gim,
        /^Вось выпраўлены тэкст:?\s*\n?/gim,
        /^ДАКЛАДНА такі ж тэкст\.?\s*\n?/gim,
        /^Вяртаю тэкст без зменаў\.?\s*\n?/gim,
    ];

    for (const pattern of unwantedPatterns) {
        reviewed = reviewed.replace(pattern, '');
    }
    reviewed = reviewed.trim();

    // Правяраем, ці не страцілі занадта шмат
    if (reviewed.length < chunk.content.length * 0.3) {
        reviewed = chunk.content;
    }

    return {
        id: chunk.id,
        original: chunk.content,
        reviewed: reviewed,
        score: 10, // Спрасціў - не парсім JSON
        issues: [],
    };
}

// ============================================
// 🔀 Паралельная апрацоўка
// ============================================

async function processChunksParallel(
    chunks: DocumentChunk[],
    mode: ReviewMode
): Promise<ChunkResult[]> {
    const results: ChunkResult[] = [];

    // Апрацоўваем батчамі
    for (let i = 0; i < chunks.length; i += MAX_PARALLEL) {
        const batch = chunks.slice(i, i + MAX_PARALLEL);
        const batchNum = Math.floor(i / MAX_PARALLEL) + 1;
        const totalBatches = Math.ceil(chunks.length / MAX_PARALLEL);

        console.log(
            `   📦 Батч ${batchNum}/${totalBatches} (${batch.length} чанкаў)...`
        );

        const batchResults = await Promise.all(
            batch.map((chunk) => reviewChunk(chunk, mode))
        );

        results.push(...batchResults);

        // Паказваем прагрэс
        const issues = batchResults.flatMap((r) => r.issues);
        if (issues.length > 0) {
            console.log(`      ⚠️ Знойдзена праблем: ${issues.length}`);
        }
    }

    return results;
}

async function processChunksSequential(
    chunks: DocumentChunk[],
    mode: ReviewMode
): Promise<ChunkResult[]> {
    const results: ChunkResult[] = [];

    for (const chunk of chunks) {
        if (chunk.type !== 'code') {
            process.stdout.write(
                `   📝 Чанк ${chunk.id + 1}/${chunks.length}...`
            );
        }

        const result = await reviewChunk(chunk, mode);
        results.push(result);

        if (chunk.type !== 'code') {
            console.log(
                result.issues.length > 0
                    ? ` ⚠️ ${result.issues.length} праблем`
                    : ' ✓'
            );
        }
    }

    return results;
}

// ============================================
// 🌐 Вузлы графа
// ============================================

async function analyzerNode(
    state: MDReviewStateType
): Promise<Partial<MDReviewStateType>> {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📊 АНАЛІЗ ДАКУМЕНТА`);
    console.log(`${'─'.repeat(50)}`);

    const content = state.originalContent;
    const chunks = splitIntoChunks(content);

    const codeChunks = chunks.filter((c) => c.type === 'code').length;
    const textChunks = chunks.length - codeChunks;

    console.log(`📄 Памер: ${content.length} сімвалаў`);
    console.log(
        `📦 Чанкаў: ${chunks.length} (${textChunks} тэкст, ${codeChunks} код)`
    );
    console.log(
        `${getModeEmoji(state.mode)} Рэжым: ${getModeName(state.mode)}`
    );
    console.log(`⚡ Паралельна: ${state.useParallel ? 'Так' : 'Не'}`);

    return { chunks };
}

async function reviewerNode(
    state: MDReviewStateType
): Promise<Partial<MDReviewStateType>> {
    const iter = state.iteration + 1;
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`${getModeEmoji(state.mode)} РЭЦЭНЗІЯ (ітэрацыя ${iter})`);
    console.log(`${'─'.repeat(50)}`);

    const startTime = Date.now();

    // Выбіраем метад апрацоўкі
    const results = state.useParallel
        ? await processChunksParallel(state.chunks, state.mode)
        : await processChunksSequential(state.chunks, state.mode);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Збіраем статыстыку
    const allIssues = results.flatMap((r) => r.issues);
    const newContent = mergeChunks(results);
    const changed = newContent !== state.currentContent;
    const approved = !changed || iter >= MAX_ITERATIONS;
    const score = approved ? 10 : 7;
    const changeLog = results
        .filter((result) => result.original !== result.reviewed)
        .map((result) => {
            const chunk = state.chunks.find((item) => item.id === result.id);

            return {
                iteration: iter,
                chunkId: result.id,
                startLine: chunk?.startLine ?? 0,
                endLine: chunk?.endLine ?? 0,
                original: result.original,
                reviewed: result.reviewed,
                summary: summarizeChanges(result.original, result.reviewed),
            };
        });

    // Фармуем зваротную сувязь
    const feedback =
        allIssues.length > 0
            ? `Знойдзена ${allIssues.length} праблем:\n${allIssues
                  .slice(0, 10)
                  .map((i) => `- ${i}`)
                  .join(
                      '\n'
                  )}${allIssues.length > 10 ? `\n... і яшчэ ${allIssues.length - 10}` : ''}`
            : 'Праблем не знойдзена';

    console.log(`\n⏱️  Час: ${duration} сек`);
    console.log(`📊 Сярэдняя ацэнка: ${score}/10`);
    console.log(`⚠️  Праблем: ${allIssues.length}`);
    console.log(
        approved
            ? '✅ ЗАЦВЕРДЖАНА'
            : '🔄 Тэкст змяніўся, запускаем кантрольны праход'
    );

    if (allIssues.length > 0) {
        console.log(`\n💬 Асноўныя праблемы:`);
        allIssues.slice(0, 5).forEach((issue) => console.log(`   - ${issue}`));
    }

    return {
        currentContent: newContent,
        chunks: splitIntoChunks(newContent),
        chunkResults: results,
        changeLog,
        feedback,
        score,
        approved,
        iteration: iter,
    };
}

async function finalizerNode(
    state: MDReviewStateType
): Promise<Partial<MDReviewStateType>> {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`🏁 ЗАВЕРШАНА`);
    console.log(`${'═'.repeat(50)}`);

    return { approved: true };
}

function shouldContinue(state: MDReviewStateType): 'reviewer' | 'finalizer' {
    if (state.approved) {
        return 'finalizer';
    }

    if (state.iteration >= MAX_ITERATIONS) {
        console.log(`\n⚠️ Дасягнуты максімум ітэрацый (${MAX_ITERATIONS})`);
        return 'finalizer';
    }

    return 'reviewer';
}

// ============================================
// 🌐 Граф
// ============================================

const workflow = new StateGraph(MDReviewState)
    .addNode('analyzer', analyzerNode)
    .addNode('reviewer', reviewerNode)
    .addNode('finalizer', finalizerNode)
    .addEdge('__start__', 'analyzer')
    .addEdge('analyzer', 'reviewer')
    .addConditionalEdges('reviewer', shouldContinue, {
        reviewer: 'reviewer',
        finalizer: 'finalizer',
    })
    .addEdge('finalizer', '__end__');

// Без checkpointer - не трэба захоўваць стэйт паміж запускамі
const app = workflow.compile();

// ============================================
// 📁 Функцыі для працы з файламі
// ============================================

function readMDFile(filePath: string): string {
    const absolutePath = resolve(filePath);

    if (!existsSync(absolutePath)) {
        throw new Error(`Файл не знойдзены: ${absolutePath}`);
    }

    if (!absolutePath.endsWith('.md')) {
        throw new Error(`Файл павінен мець пашырэнне .md`);
    }

    return readFileSync(absolutePath, 'utf-8');
}

function writeMDFile(
    originalPath: string,
    content: string,
    mode: ReviewMode
): string {
    const dir = dirname(originalPath);
    const name = basename(originalPath, '.md');
    const suffix = mode === 'full' ? 'reviewed' : mode;
    const outputPath = join(dir, `${name}_${suffix}.md`);

    writeFileSync(outputPath, content, 'utf-8');
    return outputPath;
}

function writeChangeReport(
    originalPath: string,
    entries: ChangeLogEntry[],
    mode: ReviewMode
): string {
    const dir = dirname(originalPath);
    const name = basename(originalPath, '.md');
    const suffix = mode === 'full' ? 'reviewed' : mode;
    const outputPath = join(dir, `${name}_${suffix}_changes.md`);
    const report = formatChangeReport(originalPath, entries, mode);

    writeFileSync(outputPath, report, 'utf-8');
    return outputPath;
}

function formatChangeReport(
    originalPath: string,
    entries: ChangeLogEntry[],
    mode: ReviewMode
): string {
    const lines = [
        `# Справаздача пра выпраўленні`,
        '',
        `- Файл: \`${originalPath}\``,
        `- Рэжым: ${getModeName(mode)}`,
        `- Змененых чанкаў: ${entries.length}`,
        '',
    ];

    if (entries.length === 0) {
        lines.push('Зменаў не знойдзена.', '');
        return lines.join('\n');
    }

    for (const entry of entries) {
        lines.push(
            `## Ітэрацыя ${entry.iteration}, чанк ${entry.chunkId + 1}`,
            '',
            `Радкі: ${entry.startLine + 1}-${entry.endLine + 1}`,
            '',
            `### Што і чаму змянілася`,
            '',
            ...entry.summary.map((item) => `- ${item}`),
            '',
            `### Было`,
            '',
            '```markdown',
            entry.original,
            '```',
            '',
            `### Стала`,
            '',
            '```markdown',
            entry.reviewed,
            '```',
            ''
        );
    }

    return lines.join('\n');
}

// ============================================
// 🚀 Галоўная функцыя
// ============================================

interface ReviewOptions {
    mode: ReviewMode;
    parallel: boolean;
}

async function reviewMDFile(
    filePath: string,
    options: ReviewOptions
): Promise<MDReviewStateType> {
    console.log('\n' + '═'.repeat(60));
    console.log(`📄 MD-РЭЦЭНЗЕНТ v2`);
    console.log('═'.repeat(60));

    const absolutePath = resolve(filePath);
    console.log(`\n📂 Файл: ${absolutePath}`);

    const content = readMDFile(absolutePath);

    // Паказваем структуру
    const headers = content.match(/^#{1,3}\s+.+$/gm) || [];
    if (headers.length > 0) {
        console.log(`\n📑 Структура (${headers.length} раздзелаў):`);
        headers.slice(0, 5).forEach((h) => console.log(`   ${h}`));
        if (headers.length > 5) console.log(`   ...`);
    }

    const startTime = Date.now();

    const result = await app.invoke({
        filePath: absolutePath,
        originalContent: content,
        currentContent: content,
        mode: options.mode,
        useParallel: options.parallel,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Захоўваем
    let outputPath = '';
    let reportPath = '';
    if (result.currentContent !== content) {
        outputPath = writeMDFile(
            absolutePath,
            result.currentContent,
            options.mode
        );
        reportPath = writeChangeReport(
            absolutePath,
            result.changeLog,
            options.mode
        );
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log('📊 ПАДСУМАВАННЕ');
    console.log('═'.repeat(60));
    console.log(`⏱️  Агульны час: ${duration} сек`);
    console.log(`🔄 Ітэрацый: ${result.iteration}`);
    console.log(`📊 Фінальная ацэнка: ${result.score}/10`);
    console.log(
        `${getModeEmoji(options.mode)} Рэжым: ${getModeName(options.mode)}`
    );

    if (outputPath) {
        console.log(`\n📁 Вынік: ${outputPath}`);
        console.log(`🧾 Справаздача: ${reportPath}`);
    } else {
        console.log(`\n✨ Файл не патрабуе выпраўленняў`);
    }

    console.log('═'.repeat(60));

    return result;
}

// ============================================
// 🎯 CLI
// ============================================

function parseArgs(args: string[]): { file: string; options: ReviewOptions } {
    let file = '';
    const options: ReviewOptions = {
        mode: 'full',
        parallel: false,
    };

    for (const arg of args) {
        if (arg.startsWith('--mode=')) {
            const mode = arg.replace('--mode=', '') as ReviewMode;
            if (['grammar', 'style', 'full'].includes(mode)) {
                options.mode = mode;
            }
        } else if (arg === '--parallel' || arg === '-p') {
            options.parallel = true;
        } else if (!arg.startsWith('-')) {
            file = arg;
        }
    }

    return { file, options };
}

function showHelp() {
    console.log(`
📄 MD-Рэцэнзент v2 - праверка Markdown файлаў

Выкарыстанне:
  bun run start <файл.md> [опцыі]

Опцыі:
  --mode=<рэжым>    Рэжым праверкі:
                    • grammar - толькі граматыка і правапіс
                    • style   - толькі стыль і яснасць  
                    • full    - поўная праверка (па змаўчанні)
  
  --parallel, -p    Паралельная апрацоўка (хутчэй для вялікіх файлаў)

Прыклады:
  bun run start README.md
  bun run start doc.md --mode=grammar
  bun run review large-doc.md --mode=full --parallel

Вынік:
  Файл захоўваецца як <імя>_<рэжым>.md:
  • doc_reviewed.md  (full mode)
  • doc_grammar.md   (grammar mode)
  • doc_style.md     (style mode)
`);
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }

    const { file, options } = parseArgs(args);

    if (!file) {
        console.error('❌ Не ўказаны файл');
        showHelp();
        process.exit(1);
    }

    try {
        await reviewMDFile(file, options);
    } catch (error) {
        console.error(
            `\n❌ Памылка: ${error instanceof Error ? error.message : error}`
        );
        process.exit(1);
    }
}

main().catch(console.error);
