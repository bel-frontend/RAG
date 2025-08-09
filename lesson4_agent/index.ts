import TelegramBot from 'node-telegram-bot-api';
import { agentApp } from './agent';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

const bot = new TelegramBot(token, { polling: true });

// 🧠 Map для захавання гісторыі размоў кожнага карыстальніка
const sessions = new Map<number, any>();

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "Прывітанне! Я AI-агент. Спытайся пра надвор'е, курс валют або навіны."
    );
});

bot.on('message', async (msg) => {
    const userId = msg.chat.id;
    bot.sendMessage(userId, 'Чакаю адказу...');
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    try {
        const history = sessions.get(userId) || [];
        bot.sendChatAction(userId, 'typing');

        const res = await agentApp({ bot, userId }).invoke({
            messages: [...history, { role: 'user', content: text }],
        });

        console.log('Response:', res.messages);

        const updated = res.messages;
        const lastMessage = updated[updated.length - 1];

        console.log('Last message content:', lastMessage?.content);

        // 🧩 Апрацоўка reasoning мадэляў: string, array або object
        let reply = 'Няма адказу.';

        if (lastMessage?.content) {
            if (typeof lastMessage.content === 'string') {
                reply = lastMessage.content;
            } else if (Array.isArray(lastMessage.content)) {
                // Шукаем тэкст у масіве блокаў
                for (const block of lastMessage.content) {
                    if (typeof block === 'string') {
                        reply = block;
                        break;
                    } else if (
                        block &&
                        typeof block === 'object' &&
                        'text' in block
                    ) {
                        reply = block.text as string;
                        break;
                    }
                }
            } else if (typeof lastMessage.content === 'object') {
                // Шукаем тэкст у аб'екце reasoning мадэлі
                const contentObj = lastMessage.content as any;
                if (contentObj.text) {
                    reply = contentObj.text;
                } else if (contentObj.message) {
                    reply = contentObj.message;
                } else {
                    reply = JSON.stringify(lastMessage.content);
                }
            }
        }

        sessions.set(userId, updated);
        bot.sendMessage(userId, reply);
    } catch (err: any) {
        console.error('Error:', err);
        bot.sendMessage(userId, 'Памылка: ' + err.message);
    }
});
