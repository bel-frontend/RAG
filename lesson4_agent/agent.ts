import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { chatModel, Model } from './model';
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

const getAnyProverb = tool(
    async () => {
        const res = (await fetchJson(
            'https://gist.githubusercontent.com/bel-frontend/41775a79904f2535c4dd97d7990ad83d/raw/dc6c5cb1a849961833dd157454fd3ec11129883b/index.json'
        )) as string[];
        const randomIndex = Math.floor(Math.random() * res.length);
        const randomProverb = res[randomIndex];
        console.log(randomProverb);

        return randomProverb || 'Cannot find proverb.';
    },
    {
        name: 'get_any_proverb',
        description: 'Get a random proverb',
    }
);

const model = await chatModel(Model.GPT4o);

export const agentApp = createReactAgent({
    llm: model,
    tools: [weatherTool, getAnyProverb],
    messageModifier:
        new SystemMessage(`Ты разумны памочнік. Адказвай зразумела і каротка. Адказвай на пытанні толькі
      адносна надвор'я,  і генерацыі прыказак.  Калі пытанне не адносіцца да гэтых тэм, скажы "Я не ведаю".`),
});
