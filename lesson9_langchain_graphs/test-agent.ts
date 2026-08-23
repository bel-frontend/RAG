import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { tool } from '@langchain/core/tools';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { chatModel, Model } from '../common/model';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const model = await chatModel(Model.GPT4o_MINI);

const calculatorTool = tool(
    async ({ expression }: { expression: string }) => {
        console.log(`🧮 Вылічаю: ${expression}`);
        const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
        const result = Function(`"use strict"; return (${sanitized})`)();
        return `Вынік: ${result}`;
    },
    {
        name: 'calculator',
        description: 'Вылічыць матэматычны выраз',
        schema: z.object({
            expression: z.string().describe('Матэматычны выраз'),
        }),
    }
);

// Выкарыстоўваем createReactAgent з @langchain/langgraph/prebuilt
// Гэты API усё яшчэ працуе і выконвае інструменты аўтаматычна
const agent = createReactAgent({
    llm: model as any,
    tools: [calculatorTool],
    prompt: new SystemMessage('Ты памочнік. Адказвай па-беларуску.'),
});

const result = await agent.invoke({
    messages: [new HumanMessage('Колькі будзе 25 * 4?')],
});

console.log('=== RESULT ===');
console.log('messages count:', result.messages.length);
for (const msg of result.messages) {
    console.log('---');
    console.log('type:', msg.constructor.name);
    console.log('content:', msg.content);
}
