import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { chatModel, Model } from './model';

const model = await chatModel(Model.GPT4o);

// 1. Ініцыялізуем LLM


// 2. Прампт для перакладу
const translationPrompt = PromptTemplate.fromTemplate(
    'Перакладзі гэты тэкст на беларускую мову:\n\n{input}'
);

// 3. Прампт для праверкі правапісу і лексікі
const correctionPrompt = PromptTemplate.fromTemplate(
    'Правер тэкст ніжэй на памылкі (правапіс, лексіка) і выпраў іх. Вярні толькі выпраўлены тэкст:\n\n{translatedText}'
);

// 4. Цэпачкі (RunnableSequence)
const translateChain = translationPrompt.pipe(model);
const correctChain = correctionPrompt.pipe(model);

// 5. Аб’яднаная цэпачка
const chain = RunnableSequence.from([
    async (input: { input: string }) => ({ input: input.input }),
    translateChain,
    async (translatedText: string) => ({ translatedText }), // перадаем у наступны крок
    correctChain,
    // Ensure the final output is an object with a 'content' property
    async (output: any) => ({ content: typeof output === 'string' ? output : output?.content ?? output }),
]);

// 6. Выклік
const result = await chain.invoke({
    input: 'This is a smple text with errrors for translation.',
});

console.log('✅ Выпраўлены пераклад:');
console.log(result?.content);
