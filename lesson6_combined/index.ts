import { agentApp } from './agent';
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';

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
        // Only process messages from room (channel) 1374368491771002970
        if (message.channel.id !== '1374368491771002970') return;

        console.log('Message received:', message.content);
        const userId = message.author.id;
        // 1. Check if it's a direct message (DM)
        const isDirect = message.channel.type === ChannelType.DM;

        // 2. Check if the bot is mentioned in a guild message
        const isMention = message.mentions.has(client.user?.id || '');

        if (isDirect) {
            console.log('User wrote to the bot directly (DM)');
        } else if (isMention) {
            console.log('User mentioned the bot in a server');
        } else {
            console.log('Message is not a DM or mention');
            // return; // Optionally ignore
        }

        const history = sessions.get(userId) || [];

        if (message.author.bot) return;
        console.log('User ID:', userId);

        const text = message.content;
        let imageUrl: string[] = [];
        const imageAttachments = message.attachments.filter((att) =>
            att.contentType?.startsWith('image/')
        );

        if (imageAttachments.size > 0) {
            imageAttachments.forEach((att) => {
                console.log('Image URL:', att.url);
                imageUrl.push(att.url);
            });
        }

        const res = await agentApp({ bot: message }).invoke({
            messages: [
                ...history,
                {
                    role: 'user',
                    content:
                        text +
                        (imageUrl.length > 0
                            ? `(imageUrl:${imageUrl.join(',')})`
                            : ''),
                },
            ],
        });

        const updated = res.messages;
        const reply = updated[updated.length - 1]?.content || 'Няма адказу.';
        message.channel.send(reply.toString());

        sessions.set(userId, updated);

        if (message.author.bot) return;
    });
    client.login(TOKEN);
} catch (error) {
    console.error('Error initializing Discord bot:', error);
}
