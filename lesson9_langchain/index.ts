/**
 * LangChain v1 - Базавы прыклад агента
 * 
 * Гэты прыклад дэманструе:
 * - Стварэнне агента з createReactAgent
 * - Вызначэнне інструментаў з tool()
 * - Выкарыстанне агульнай функцыі chatModel
 * - Streaming адказаў
 */

import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { tool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { chatModel, Model } from '../common/model';
import { config } from 'dotenv';
import { resolve } from 'path';

// Загрузка .env з бацькоўскай тэчкі
config({ path: resolve(__dirname, '../.env') });

// ============================================
// 🔧 Вызначэнне інструментаў (Tools)
// ============================================

// Дапаможная функцыя для fetch
const fetchJson = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch error ${res.status}`);
    return res.json();
};

const fetchText = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch error ${res.status}`);
    return res.text();
};

// 🌤️ Інструмент: Надвор'е
const weatherTool = tool(
    async ({ city }: { city: string }) => {
        console.log(`🌤️ Атрымліваю надвор'е для: ${city}`);
        const res = await fetchText(`https://wttr.in/${city}?format=3`);
        return res || 'Не ўдалося знайсці надвор\'е.';
    },
    {
        name: 'get_weather',
        description: 'Атрымаць бягучае надвор\'е для горада',
        schema: z.object({
            city: z.string().describe('Назва горада'),
        }),
    }
);

// 📚 Інструмент: Беларускія прыказкі
const proverbsTool = tool(
    async ({ topic }: { topic?: string }) => {
        console.log(`📚 Шукаю прыказкі${topic ? ` па тэме: ${topic}` : ''}`);
        
        const res = (await fetchJson(
            'https://gist.githubusercontent.com/bel-frontend/41775a79904f2535c4dd97d7990ad83d/raw/dc6c5cb1a849961833dd157454fd3ec11129883b/index.json'
        )) as { message: string }[];

        const allProverbs = res.map(p => p.message).join('\n');
        return allProverbs || 'Не ўдалося знайсці прыказкі.';
    },
    {
        name: 'get_proverbs',
        description: 'Атрымаць спіс беларускіх прыказак і прымавак',
        schema: z.object({
            topic: z.string().optional().describe('Тэма для фільтрацыі прыказак'),
        }),
    }
);

// 🧮 Інструмент: Калькулятар
const calculatorTool = tool(
    async ({ expression }: { expression: string }) => {
        console.log(`🧮 Вылічаю: ${expression}`);
        try {
            // Бяспечнае вылічэнне матэматычных выразаў
            const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
            const result = Function(`"use strict"; return (${sanitized})`)();
            return `Вынік: ${result}`;
        } catch (error) {
            return `Памылка вылічэння: ${error}`;
        }
    },
    {
        name: 'calculator',
        description: 'Вылічыць матэматычны выраз',
        schema: z.object({
            expression: z.string().describe('Матэматычны выраз для вылічэння'),
        }),
    }
);

// 📅 Інструмент: Бягучая дата і час
const dateTimeTool = tool(
    async () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Minsk',
        };
        return `Бягучая дата і час (Мінск): ${now.toLocaleDateString('be-BY', options)}`;
    },
    {
        name: 'get_datetime',
        description: 'Атрымаць бягучую дату і час',
    }
);

// ============================================
// 🤖 Ініцыялізацыя мадэлі
// ============================================

// Выкарыстоўваем агульную функцыю chatModel з common/model.ts
// Можна выбраць любую мадэль з enum Model
const model = await chatModel(Model.GPT4o_MINI);

console.log(`🤖 Выкарыстоўваю мадэль: ${Model.GPT4o_MINI}`);

// ============================================
// 🚀 Стварэнне агента
// ============================================

const systemPrompt = `Ты разумны AI-асістэнт, які размаўляе па-беларуску.

Ты маеш доступ да наступных інструментаў:
- get_weather: атрымаць надвор'е для горада
- get_proverbs: атрымаць беларускія прыказкі
- calculator: вылічыць матэматычны выраз
- get_datetime: атрымаць бягучую дату і час

Адказвай зразумела і каротка. Калі пытанне не патрабуе інструментаў, адказвай напрамую.
Заўсёды адказвай па-беларуску.`;

// createReactAgent - стварае агента з падтрымкай інструментаў
const agent = createReactAgent({
    llm: model as any,
    tools: [weatherTool, proverbsTool, calculatorTool, dateTimeTool],
    messageModifier: new SystemMessage(systemPrompt),
});

// ============================================
// 💬 Запуск агента
// ============================================

async function chat(message: string) {
    console.log(`\n👤 Карыстальнік: ${message}`);
    console.log('─'.repeat(50));

    const result = await agent.invoke({
        messages: [new HumanMessage(message)],
    });

    // Атрымаць апошні адказ агента
    const lastMessage = result.messages[result.messages.length - 1];
    console.log(`\n🤖 Агент: ${lastMessage.content}`);
    console.log('═'.repeat(50));

    return lastMessage.content;
}

// Прыклад з streaming
async function chatWithStreaming(message: string) {
    console.log(`\n👤 Карыстальнік: ${message}`);
    console.log('─'.repeat(50));
    console.log('🤖 Агент: ');

    const stream = await agent.stream({
        messages: [new HumanMessage(message)],
    });

    for await (const chunk of stream) {
        const agentChunk = chunk as any;
        if (agentChunk.agent?.messages?.[0]?.content) {
            process.stdout.write(String(agentChunk.agent.messages[0].content));
        }
    }
    
    console.log('\n' + '═'.repeat(50));
}

// ============================================
// 🎯 Прыклады запытаў
// ============================================

async function main() {
    console.log('🚀 LangChain v1 - Дэманстрацыя агента');
    console.log('═'.repeat(50));

    // Прыклад 1: Надвор'е
    await chat('Якое надвор\'е ў Мінску?');

    // Прыклад 2: Прыказкі
    await chat('Дай мне беларускую прыказку пра працу');

    // Прыклад 3: Калькулятар
    await chat('Колькі будзе 25 * 4 + 100?');

    // Прыклад 4: Дата і час
    await chat('Які сёння дзень?');

    // Прыклад 5: Камбінаваны запыт
    await chat('Якое надвор\'е ў Гродне і дай прыказку пра надвор\'е');
}

main().catch(console.error);
