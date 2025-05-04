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

const model = await chatModel(Model.GEMMA3_12B);

bot.on('message', async (msg) => {
    const userId = msg.chat.id;
    bot.sendMessage(userId, 'Чакаю адказу...');
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    try {
        const history = sessions.get(userId) || [];
        bot.sendChatAction(userId, 'typing');
        const input = [...history, { role: 'user', content: text }];
        const res = await model.invoke(input);

        const updated = res;
        console.log('Updated:', updated);


        sessions.set(userId, updated.content);
        bot.sendMessage(userId, updated.content.toString());
    } catch (err: any) {
        console.error('Error:', err);
        bot.sendMessage(userId, 'Памылка: ' + err.message);
    }
});
