import TelegramBot from 'node-telegram-bot-api';

import { searchString } from './qdrant/embeddings';
import { embeddingsModel } from './openai/embeddings';
import { chatModel, Model } from './model';
import { COLLECTION_NAME } from './qdrant/collection';
import { PromptSDK } from 'goman-live';


const applicationId = process.env.APPLICATION_ID!;
const promptId = process.env.PROMPT_ID!;
const apikey = process.env.API_KEY!;
const baseurl = process.env.BASE_URL!;

if (!applicationId || !promptId || !apikey || !baseurl) {
    throw new Error('Missing required environment variables');
}

const sdk = new PromptSDK({
    applicationId,
    apiKey: apikey,
    baseUrl: baseurl,
});

let RAG_IS_ON = true; // 🧠 for controlling RAG mode
const sessions = new Map<number, any>(); // 🧠 for storing user history

/**
 * Toggles the RAG mode.
 */
export const toggleRAG = () => {
    RAG_IS_ON = !RAG_IS_ON;
    return RAG_IS_ON;
};

/**
 * Clears the session history for a specific user.
 * @param userId - The ID of the user.
 */
export const clearSessionHistory = (userId: number) => {
    sessions.set(userId, []);
};

/**
 * Handles a user message and generates a response.
 * @param userId - The ID of the user.
 * @param text - The user's input text.
 * @returns The assistant's response.
 */
export const handleUserMessage = async (userId: number, text: string): Promise<string> => {
    if (!text || text.startsWith('/')) return '';

    const systemPrompt = await sdk.getPromptFromRemote(promptId);

    const resSearch = (
        await searchString(text, 10, {
            embeddingsModelExternal: embeddingsModel,
            collectionName: COLLECTION_NAME,
        })
    )
        .map((item: any) => ({
            text: item.text.replace(/\n/g, ' ').replace(/ {2,}/g, ' '),
            score: item.score,
            source: item.source,
            id: item.id,
        }))
        .filter((item: any) => item.score > 0.5);

    console.log('resSearch', resSearch);

    const model = (await chatModel(Model.GPT4o)) as any;

    try {
        const history = sessions.get(userId) || [];
        const input = [
            ...history,
            {
                role: 'system',
                content: `${systemPrompt.value}`,
            },

            ...(RAG_IS_ON
                ? resSearch.map((item: any) => ({
                      role: 'user',
                      content: item.text + `\n\nSource: ${item.source}`,
                  }))
                : []),
            { role: 'user', content: text },
        ];
        const res = await model.invoke(input);
        sessions.set(userId, [
            ...history,
            { role: 'user', content: text },
            { role: 'assistant', content: res.content },
        ]);

        return res.content || '';
    } catch (err: any) {
        console.error('Error:', err);
        throw new Error('Error generating response: ' + err.message);
    }
};

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        'Прывітанне! Я AI-агент. Спытайся пра надвор’е, курс валют або навіны.'
    );
    clearSessionHistory(msg.chat.id);
});
bot.onText(/\/RAG/, (msg) => {
    const isRAGOn = toggleRAG();
    clearSessionHistory(msg.chat.id);
    bot.sendMessage(msg.chat.id, `RAG is ${isRAGOn ? 'ON' : 'OFF'}.`);
});

bot.on('message', async (msg) => {
    const userId = msg.chat.id;
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    bot.sendChatAction(userId, 'typing');
    try {
        const response = await handleUserMessage(userId, text);
        bot.sendMessage(userId, response);
    } catch (err: any) {
        bot.sendMessage(userId, 'Памылка: ' + err.message);
    }
});
