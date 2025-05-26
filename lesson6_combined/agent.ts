import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { chatModel, Model } from './model';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SystemMessage } from '@langchain/core/messages';
import ollama from 'ollama';

const fetchJson = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch error ${res.status}`);
    return res.json();
};

const fetchText = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch error ${res.status}`);
    return res.text();
};

// 📦 Інструмент 1: надвор'е
const weatherTool = tool(
    async ({ city }: { city: string }) => {
        const res = await fetchText(`https://wttr.in/${city}?format=3`);
        return res || 'Cannot find weather.';
    },
    {
        name: 'get_weather',
        description: 'Get current weather for a given city',
        schema: z.object({ city: z.string() }), // выкарыстоўваецца для валідацыі
    }
);

const getProverbByTopic = tool(
    async () => {
        console.log('Fetching proverbs');

        const res = (await fetchJson(
            'https://gist.githubusercontent.com/bel-frontend/41775a79904f2535c4dd97d7990ad83d/raw/dc6c5cb1a849961833dd157454fd3ec11129883b/index.json'
        )) as { message: string }[];

        console.log(res);

        const allProverbsInOneString = res.reduce((acc, curr) => {
            return acc + curr.message + '\n';
        }, '');

        return allProverbsInOneString || 'Cannot find proverbs.';
    },
    {
        name: 'get_proverb_by_topic',
        description:
            'Get full list of proverbs for search or selecting by topic or random',
    }
);

/**
 * Загружае выяву з URL і вяртае яе як base64-радок
 * Працюе з убудаваным fetch у Node.js >=18
 */
export const imageUrlToBase64 = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Не ўдалося загрузіць выяву: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return buffer.toString('base64');
};

const getReceptFromRefregeratorImage = tool(
    async ({ imageUrl }: { imageUrl: string[] }) => {
        try {
            console.log('Processing image URLs:', imageUrl);

            if (!imageUrl || imageUrl.length === 0) {
                return 'Не атрымалася атрымаць выяву з URL.';
            }
            let imagesBase64 = await Promise.all(
                imageUrl.map((url) => imageUrlToBase64(url))
            );

            const response = await ollama.chat({
                model: 'gemma3:12b',
                messages: [
                    {
                        role: 'user',
                        content: 'What goods are in my refrigerator?',
                        images: imagesBase64,
                    },
                ],
            });
            console.log(response.message.content);

            return response.message.content || 'Не ўдалося апрацаваць выяву.';
        } catch (error) {
            console.error('Error processing image:', error);
            return 'Не ўдалося апрацаваць выяву. Правер URL і фармат выявы.';
        }
    },
    {
        name: 'get_recept_from_refregerator_image',
        description: 'Get detailed recipe(s) from refrigerators goods on images',
        schema: z.object({ imageUrl: z.array(z.string()) }), // выкарыстоўваецца для валідацыі
    }
);

const model = await chatModel(Model.GPT4o);

export const agentApp = ({ bot }: { bot: any }) => {
    const getDogPhoto = tool(
        async () => {
            const res = (await fetchJson(
                'https://dog.ceo/api/breeds/image/random'
            )) as { message: string };
            const imageUrl = res?.message;
            if (!imageUrl) return 'Не ўдалося атрымаць выяву сабакі.';
            bot.channel.send({
                content: 'Вось вам выява сабакі:',
                files: [imageUrl],
            });

            return 'Выява сабакі дасланая.';
        },
        {
            name: 'get_dog_photo',
            description: `Get a random dog photo and send it to the user in the chat`,
        }
    );

    return createReactAgent({
        llm: model,
        tools: [
            weatherTool,
            getProverbByTopic,
            getDogPhoto,
            getReceptFromRefregeratorImage,
        ],
        messageModifier:
            new SystemMessage(`Ты разумны памочнік. Адказвай зразумела і каротка. Адказвай на пытанні толькі
      адносна надвор'я, генерацыі прыказак , запыт фотаграйі сабак, запыт рэцэптаў ці што паснедаць ці прыгатаваць.   Калі пытанне не адносіцца да гэтых тэм, скажы "Я не ведаю". Адказвай па-беларуску`),
    });
};
