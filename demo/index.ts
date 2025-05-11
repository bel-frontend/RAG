import TelegramBot from 'node-telegram-bot-api';

import { searchString } from './qdrant/embeddings';
import { embeddingsModel } from './openai/embeddings';
import { chatModel, Model } from './model';
import { COLLECTION_NAME } from './qdrant/collection';
import { PromptSDK } from 'goman-live';

const applicationId = 'appIDec34bf94bf92bf5d';
const promptId = '6820b9d11e8d396dbdd76f30';
const apikey =
    'apkdf59b4097d660c2a8e38c9d2947085fb4a66f1234275eeeb0ac572c18bf00427';

const baseurl = 'https://api.goman.live';
const sdk = new PromptSDK({
    applicationId,
    apiKey: apikey,
    baseUrl: baseurl,
});

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

const bot = new TelegramBot(token, { polling: true });

const sessions = new Map<number, any>(); // 🧠 для history

let RAG_IS_ON = true; // 🧠 для history

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        'Прывітанне! Я AI-агент. Спытайся пра надвор’е, курс валют або навіны.'
    );
    sessions.set(msg.chat.id, []);
});
bot.onText(/\/RAG/, (msg) => {
    RAG_IS_ON = !RAG_IS_ON;
    // clear history
    sessions.set(msg.chat.id, []);
    bot.sendMessage(msg.chat.id, `RAG is ${RAG_IS_ON ? 'ON' : 'OFF'}.`);
});

bot.on('message', async (msg) => {
    const systemPrompt = await sdk.getPromptFromRemote(promptId);
    const userId = msg.chat.id;
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

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
        bot.sendChatAction(userId, 'typing');
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

        bot.sendMessage(userId, res.content || '');
    } catch (err: any) {
        console.error('Error:', err);
        bot.sendMessage(userId, 'Памылка: ' + err.message);
    }
});
