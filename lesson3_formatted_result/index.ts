import TelegramBot from 'node-telegram-bot-api';
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
    // clear  history
    sessions.set(msg.chat.id, []);
});

import { z } from 'zod';

const schema = z.object({
    is_scam: z.boolean().describe('Result of  checkein  text is scam or not'),
    description: z.string().describe('Description, why it is scam'),
});

const model = await chatModel(Model.GPT4o);
const structuredModel  = model.withStructuredOutput(schema);

bot.on('message', async (msg) => {
    const userId = msg.chat.id;
    bot.sendMessage(userId, 'Чакаю адказу...');
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    try {
        const history = sessions.get(userId) || [];
        bot.sendChatAction(userId, 'typing');
        const input = [...history,{
            role: 'system',
            content: `Ты AI-адміністратар каналу пра тэхналогіі. Тваё заданне - вызначаць, ці з'яўляецца тэкст скамам ці спамам. Калі так, дай падрабязнае тлумачэнне, чаму ён скам ці спам. Калі не, дай падрабязнае тлумачэнне, чаму ён не скам.`,
        }, { role: 'user', content: text }];
        const res = await structuredModel.invoke(input);

        const updated = res;
        console.log('Updated:', updated);


        // sessions.set(userId, updated.);
        bot.sendMessage(userId, `${updated.is_scam ? 'Скам' : 'Не скам'}\n\n${updated.description}, ${JSON.stringify(updated)}`);
    } catch (err: any) {
        console.error('Error:', err);
        bot.sendMessage(userId, 'Памылка: ' + err.message);
    }
});
