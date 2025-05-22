import { agentApp } from './agent';
import { Client, GatewayIntentBits } from 'discord.js';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) throw new Error('Missing DISCORD_BOT_TOKEN');

const sessions = new Map<string, any>(); // 🧠 для history
try {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
        ],
    });

    client.once('ready', () => {
        if (client.user) {
            console.log(`Logged in as ${client.user.tag}`);
        } else {
            console.log('Logged in, but client.user is null');
        }
    });

    client.on('messageCreate', async (message) => {
        console.log('Message received:', message.content);
        const userId = message.author.id ;
        const history = sessions.get(userId) || [];

        if (message.author.bot) return;
        console.log('User ID:', userId);
        
        const  text = message.content;

        // message.reply('Чакаю адказу...');
        // message.

        // client.sendMessage(userId, 'Чакаю адказу...');
        // const text = msg.text;
        // if (!text || text.startsWith('/')) return;

        // try {
        //     bot.sendChatAction(userId, 'typing');

            const res = await agentApp({bot: message }).invoke({
                messages: [...history, { role: 'user', content: text }],
            });
            console.log('Response:', res?.messages);
            


            const updated = res.messages;
            const reply =
                updated[updated.length - 1]?.content || 'Няма адказу.';
            message.channel.send(reply.toString());

            sessions.set(userId, updated);

        //     bot.sendMessage(userId, reply.toString());
        // } catch (err: any) {
        //     console.error('Error:', err);
        //     bot.sendMessage(userId, 'Памылка: ' + err.message);
        // }
        
        if (message.author.bot) return;

    });
    client.login(TOKEN);
} catch (error) {
    console.error('Error initializing Discord bot:', error);
}
