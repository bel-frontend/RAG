import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { chatModel, Model } from '../common/model';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SystemMessage } from '@langchain/core/messages';

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
            'Get full list of proverbs (прыказкі і прымаўкі) for search or selecting by topic or random on Belarussian  language',
    }
);

const model = await chatModel(Model.GPT4o);

export const agentApp = ({ bot, userId }: { bot: any; userId: number }) => {
    const getDogPhoto = tool(
        async () => {
            const res = (await fetchJson(
                'https://dog.ceo/api/breeds/image/random'
            )) as { message: string };
            const imageUrl = res?.message;
            if (!imageUrl) return 'Не ўдалося атрымаць выяву сабакі.';
            bot.sendPhoto(userId, imageUrl);

            return 'Выява сабакі дасланая.';
        },
        {
            name: 'get_dog_photo',
            description: `Send to user random dog photo`,
        }
    );

    const res = createReactAgent({
        llm: model,
        tools: [weatherTool, getProverbByTopic, getDogPhoto],
        messageModifier:
            new SystemMessage(`Ты разумны памочнік. Адказвай зразумела і каротка. Адказвай на пытанні толькі
      адносна надвор'я, генерацыі прыказак і фоты сабакі. Калі пытанне не адносіцца да гэтых тэм, скажы "Я не ведаю".`),
    });

    return res;
};
