/**
 * LangGraph - Прыклад мульты-агентнай сістэмы
 * 
 * Гэты прыклад дэманструе:
 * - Стварэнне графа з StateGraph
 * - Мульты-агентная архітэктура (даследчык → пісьменнік → рэцэнзент)
 * - Умоўныя пераходы
 * - Persistence з MemorySaver
 */

import { StateGraph, Annotation, MemorySaver } from '@langchain/langgraph';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
import { chatModel, Model } from '../common/model';
import { config } from 'dotenv';
import { resolve } from 'path';

// Загрузка .env з бацькоўскай тэчкі
config({ path: resolve(__dirname, '../.env') });

// ============================================
// 📊 Вызначэнне стану графа
// ============================================

const ResearchState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (curr, update) => [...curr, ...update],
        default: () => [],
    }),
    topic: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    research: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    draft: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    review: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    finalArticle: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    iterationCount: Annotation<number>({
        reducer: (_, update) => update,
        default: () => 0,
    }),
});

type ResearchStateType = typeof ResearchState.State;

// ============================================
// 🤖 Ініцыялізацыя мадэлі
// ============================================

const model = await chatModel(Model.GPT4o_MINI);

// ============================================
// 👥 Вузлы агентаў
// ============================================

// 🔬 Даследчык - збірае інфармацыю
async function researcherNode(state: ResearchStateType): Promise<Partial<ResearchStateType>> {
    console.log('\n🔬 [ДАСЛЕДЧЫК] Пачынаю даследаванне...');
    
    const topic = state.topic || String(state.messages[state.messages.length - 1]?.content) || '';
    
    const prompt = `Ты эксперт-даследчык. Твая задача - сабраць ключавую інфармацыю па тэме.
    
Тэма: ${topic}

Правядзі кароткае даследаванне і падрыхтуй асноўныя факты і тэзісы (не больш 200 слоў).
Адказвай па-беларуску.`;

    const response = await model.invoke([
        { role: 'system', content: prompt },
        { role: 'user', content: `Даследуй тэму: ${topic}` },
    ]);

    const research = String(response.content);
    console.log(`📋 Вынік даследавання: ${research.substring(0, 150)}...`);

    return {
        research,
        messages: [new AIMessage({ content: `[Даследаванне завершана]\n${research}` })],
    };
}

// ✍️ Пісьменнік - піша артыкул
async function writerNode(state: ResearchStateType): Promise<Partial<ResearchStateType>> {
    console.log('\n✍️ [ПІСЬМЕННІК] Пішу артыкул...');
    
    const prompt = `Ты прафесійны тэхнічны пісьменнік. На аснове даследавання напішы артыкул.

Даследаванне:
${state.research}

${state.review ? `Папярэдняя рэцэнзія (улічы заўвагі):
${state.review}` : ''}

Напішы кароткі, але інфарматыўны артыкул па-беларуску (не больш 300 слоў).`;

    const response = await model.invoke([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Напішы артыкул на аснове даследавання' },
    ]);

    const draft = String(response.content);
    console.log(`📝 Чарнавік: ${draft.substring(0, 150)}...`);

    return {
        draft,
        iterationCount: state.iterationCount + 1,
        messages: [new AIMessage({ content: `[Чарнавік ${state.iterationCount + 1}]\n${draft}` })],
    };
}

// 📖 Рэцэнзент - правярае артыкул
async function reviewerNode(state: ResearchStateType): Promise<Partial<ResearchStateType>> {
    console.log('\n📖 [РЭЦЭНЗЕНТ] Правяраю артыкул...');
    
    const prompt = `Ты строгі рэдактар і рэцэнзент. Ацані артыкул і дай канструктыўную зваротную сувязь.

Артыкул:
${state.draft}

Ацані па крытэрыях:
1. Дакладнасць інфармацыі
2. Структура і лагічнасць
3. Якасць мовы
4. Паўната раскрыцця тэмы

Калі артыкул добры - скажы "ЗАЦВЕРДЖАНА".
Калі трэба дапрацаваць - дай канкрэтныя рэкамендацыі.

Адказвай па-беларуску.`;

    const response = await model.invoke([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Правер артыкул' },
    ]);

    const review = String(response.content);
    console.log(`📋 Рэцэнзія: ${review.substring(0, 150)}...`);

    return {
        review,
        messages: [new AIMessage({ content: `[Рэцэнзія]\n${review}` })],
    };
}

// 🏁 Фіналізатар - завяршае працу
async function finalizerNode(state: ResearchStateType): Promise<Partial<ResearchStateType>> {
    console.log('\n🏁 [ФІНАЛІЗАТАР] Завяршаю працу...');
    
    return {
        finalArticle: state.draft,
        messages: [new AIMessage({ content: `[ГАТОВА]\n\n${state.draft}` })],
    };
}

// ============================================
// 🔀 Умоўныя пераходы
// ============================================

function shouldContinue(state: ResearchStateType): 'writer' | 'finalizer' {
    const review = state.review.toLowerCase();
    const maxIterations = 3;

    // Праверка на зацвярджэнне або максімальную колькасць ітэрацый
    if (review.includes('зацверджана') || review.includes('approved') || 
        state.iterationCount >= maxIterations) {
        console.log(`\n✅ Артыкул зацверджаны (ітэрацый: ${state.iterationCount})`);
        return 'finalizer';
    }

    console.log(`\n🔄 Патрабуецца дапрацоўка (ітэрацыя ${state.iterationCount})`);
    return 'writer';
}

// ============================================
// 🌐 Стварэнне графа
// ============================================

const workflow = new StateGraph(ResearchState)
    // Дадаем вузлы
    .addNode('researcher', researcherNode)
    .addNode('writer', writerNode)
    .addNode('reviewer', reviewerNode)
    .addNode('finalizer', finalizerNode)
    
    // Вызначаем пераходы
    .addEdge('__start__', 'researcher')
    .addEdge('researcher', 'writer')
    .addEdge('writer', 'reviewer')
    .addConditionalEdges('reviewer', shouldContinue, {
        writer: 'writer',
        finalizer: 'finalizer',
    })
    .addEdge('finalizer', '__end__');

// Кампіляцыя з checkpointer для persistence
const checkpointer = new MemorySaver();

const app = workflow.compile({
    checkpointer,
});

// ============================================
// 🚀 Запуск
// ============================================

async function runResearchTeam(topic: string, threadId: string = 'default') {
    console.log('═'.repeat(60));
    console.log('🚀 МУЛЬТЫ-АГЕНТНАЯ СІСТЭМА ДАСЛЕДАВАННЯ');
    console.log('═'.repeat(60));
    console.log(`📌 Тэма: ${topic}`);
    console.log(`🧵 Thread ID: ${threadId}`);
    console.log('─'.repeat(60));

    const config = {
        configurable: {
            thread_id: threadId,
        },
    };

    const result = await app.invoke(
        {
            topic,
            messages: [new HumanMessage(topic)] as BaseMessage[],
        },
        config
    );

    console.log('\n' + '═'.repeat(60));
    console.log('📄 ФІНАЛЬНЫ АРТЫКУЛ:');
    console.log('═'.repeat(60));
    console.log(result.finalArticle);
    console.log('═'.repeat(60));

    return result;
}

// ============================================
// 🎯 Галоўная функцыя
// ============================================

async function main() {
    console.log('🎯 LangGraph - Дэманстрацыя мульты-агентнай сістэмы\n');

    // Запуск мульты-агентнай сістэмы
    await runResearchTeam(
        'Перавагі выкарыстання LangChain для стварэння AI-агентаў',
        'article-1'
    );
}

main().catch(console.error);
