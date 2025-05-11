import TelegramBot from 'node-telegram-bot-api';

import { searchString } from './qdrant/embeddings';
import { embeddingsModel } from './openai/embeddings';
import { chatModel, Model } from './model';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

const bot = new TelegramBot(token, { polling: true });

const sessions = new Map<number, any>(); // 🧠 для history

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        'Прывітанне! Я AI-агент. Спытайся пра надвор’е, курс валют або навіны.'
    );
    sessions.set(msg.chat.id, []);
});

bot.on('message', async (msg) => {
    const userId = msg.chat.id;
    const text = msg.text;
    const promptQuery = text;
    if (!text || text.startsWith('/')) return;
    const resSearch = (
        await searchString(promptQuery, 10, {
            embeddingsModelExternal: embeddingsModel,
            collectionName: 'openai_collection',
        })
    ).map((item: any) => ({
        text: item.text.replace('\n', ' ').replace('  ', ' '),
        score: item.score,
    }));

    console.log('resSearch', resSearch);

    const model = (await chatModel(Model.GPT4o)) as any;

    try {
        const history = sessions.get(userId) || [];
        bot.sendChatAction(userId, 'typing');
        const input = [
            ...history,
            {
                role: 'system',
                content: `You AI-assistant. We help user to find information about LibreOffice.  Answer only about libre office from  context.  If the question is not related to this topic, or doesn't  in context say "I don't know".`,
            },

            ...resSearch.map((item: any) => ({
                role: 'user',
                content: item.text,
            })),
            { role: 'user', content: text },
        ];
        const res = await model.invoke(input);

        // sessions.set(userId, );
        bot.sendMessage(userId, res.content || '');
    } catch (err: any) {
        console.error('Error:', err);
        bot.sendMessage(userId, 'Памылка: ' + err.message);
    }
});
