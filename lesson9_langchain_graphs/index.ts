/**
 * LangChain v1 - Базавы прыклад агента
 * 
 * Гэты прыклад дэманструе новы API LangChain v1:
 * - createAgent замест createReactAgent
 * - tool з 'langchain' замест '@langchain/core/tools'
 * - systemPrompt замест prompt/messageModifier
 * - Новы streaming з streamMode
 * 
 * Дакументацыя: https://docs.langchain.com/oss/javascript/migrate/langchain-v1
 */

import { createAgent, tool, HumanMessage } from 'langchain';
import { z } from 'zod';
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

// У LangChain v1 можна выкарыстоўваць радковы ідэнтыфікатар мадэлі
// Фармат: "правайдэр:мадэль", напрыклад "openai:gpt-4o-mini"
const modelName = 'openai:gpt-4o-mini';

console.log(`🤖 Выкарыстоўваю мадэль: ${modelName}`);

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

// createAgent - новы API LangChain v1
// - model: радковы ідэнтыфікатар "правайдэр:мадэль" або экзэмпляр мадэлі
// - tools: масіў інструментаў
// - systemPrompt: сістэмны prompt (замест prompt/messageModifier)
const agent = createAgent({
    model: modelName,
    tools: [weatherTool, proverbsTool, calculatorTool, dateTimeTool],
    systemPrompt: systemPrompt,
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
// У LangChain v1 назва вузла змянілася з "agent" на "model"
async function chatWithStreaming(message: string) {
    console.log(`\n👤 Карыстальнік: ${message}`);
    console.log('─'.repeat(50));
    console.log('🤖 Агент: ');

    const stream = await agent.stream(
        { messages: [new HumanMessage(message)] },
        { streamMode: 'values' }
    );

    for await (const chunk of stream) {
        const lastMessage = chunk.messages[chunk.messages.length - 1];
        if (lastMessage?.content) {
            process.stdout.write(String(lastMessage.content));
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
