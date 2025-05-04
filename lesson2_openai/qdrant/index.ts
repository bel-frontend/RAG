import { addDocToSearch, searchString } from './embeddings';
import ollama from 'ollama';

const promptQuery =
    'што ты ведаеш  пра Zero-shot ды граундынг. Дай прыклады для кожнай тэхнікі. Якія  яшчэ тэхнікі ты ведаеш? і дзе пра  гэта пачытаць?';

const res = await searchString(promptQuery);
console.log(
    'Search results:',
    res.map((item) => ({
        role: 'system',
        content: item.text,
    }))
);

const response = await ollama.chat({
    model: 'gemma3:12b',
    messages: [
        {
            role: 'system',
            content:
                'Ты - эксперт у галіне штучнага інтэлекту. Адказвай на пытанні па-беларуску, Улічвай прадстаўленыя дадзеныя як аснову адказу. Адказвай поўнымі адказамі і на ўсе пытанні',
        },
        {
            role: 'system',
            content:
                'Твой адказ павінен быць заснаваны толькі на прадстаўленай інфармацыі.',
        },
        ...res.map((item) => ({
            role: 'user',
            content: item.text,
        })),

        {
            role: 'user',
            content: promptQuery,
        },
    ],
});

console.log('Response:', response.message.content);

// addDocToSearch();
