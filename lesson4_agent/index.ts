import TelegramBot from "node-telegram-bot-api";
import { agentApp } from "./agent";



const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");

const bot = new TelegramBot(token, { polling: true });

const sessions = new Map<number, any>(); // 🧠 для history

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Прывітанне! Я AI-агент. Спытайся пра надвор’е, курс валют або навіны.",
  );
});

bot.on("message", async (msg) => {
  const userId = msg.chat.id;
  bot.sendMessage(userId, "Чакаю адказу..." );
  const text = msg.text;
  if (!text || text.startsWith("/")) return;

  try {
    const history = sessions.get(userId) || [];
    bot.sendChatAction(userId,"typing");
    const res = await agentApp.invoke({
      messages: [...history, { role: "user", content: text }],
    });

    const updated = res.messages;
    const reply = updated[updated.length - 1]?.content || "Няма адказу.";
    sessions.set(userId, updated);
    bot.sendMessage(userId, reply.toString());
  } catch (err: any) {
    console.error("Error:", err);
    bot.sendMessage(userId, "Памылка: " + err.message);
  }
});
