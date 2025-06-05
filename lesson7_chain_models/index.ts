import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { chatModel, Model } from './model';

const model = await chatModel(Model.GPT4o);
// 1. Prompt: Пераклад і праверка тэматыкі
const translationPrompt = PromptTemplate.fromTemplate(
    `You are a professional copywriter-translator. Check the users content to ensure it pertains to news about technologies, AI, devices, phones, computers, laptops, gadgets, large companies (MANG, Tesla, Samsung, etc), science, discoveries, computer games, movies, etc. If the news is not about these topics, return the response JSON: {{"title":"error", "content": null}}. Otherwise, make summary-brief (no more 150 words) and translate result to Belarussian language. Return text only on Belarussian language.\n\n{input}`
  );
  
  // 2. Prompt: Выпраўленне
  const correctionPrompt = PromptTemplate.fromTemplate(
    'Правер тэкст ніжэй на памылкі (правапіс, лексіка) і выпраў іх. Вярні толькі выпраўлены тэкст:\n\n{translatedText}'
  );
  
  // 3. Ланцужкі
  const translateChain = translationPrompt.pipe(model);
  const correctChain = correctionPrompt.pipe(model);
  
  // 4. Аб’яднаная цэпачка з вяртаннем усіх этапаў
  const chain = RunnableSequence.from([
    async (input: { input: string }) => ({ input: input.input }),
  
    // ⬇️ Пераклад і рэзюмэ
    async (values: { input: string }) => {
      const translated = await translateChain.invoke(values);
      return {
        input: values.input,
        translatedText: translated,
      };
    },
  
    // ⬇️ Выпраўленне
    async (values: { input: string; translatedText: string }) => {
      const corrected = await correctChain.invoke({
        translatedText: values.translatedText,
      });
  
      return {
        originalText: values.input,
        translatedText: values.translatedText,
        correctedText:
          typeof corrected === 'string'
            ? corrected
            // @ts-ignore
            : corrected?.content ?? corrected,
      };
    },
  ]);
  
// 6. Выклік
const result = await chain.invoke({
    input: `Apple will have to continue allowing web links and external payment options in the App Store after its request to halt a judge’s order was rejected today by a higher court.

In April, a federal judge demanded that Apple begin allowing web links, cease restricting how links are formatted, and enable developers to offer external payment options without giving the company a cut of their revenue. Apple promptly appealed and requested that the order be put on hold until the legal proceedings were finished.

But an appeals court has now denied Apple’s emergency request to block the order. The court said it was “not persuaded” that blocking the order was appropriate after weighing Apple’s chances to succeed on appeal, whether Apple would be irreparably harmed, whether other parties would be hurt if the order is halted, and what supports the public interest.

Spotify, Kindle, and other big apps have quickly added options for web purchases

The rejection bodes poorly for Apple’s chance of overturning the order, which stems from a lawsuit by Epic Games. Epic sued Apple over its App Store restrictions back in 2020. Epic notched only a narrow win in the case, with the court ordering Apple to allow developers to communicate with their users about better pricing.

Then, in April, in a scathing ruling, the court said that Apple had repeatedly failed to comply. The judge then gave Apple a more explicit order about how the App Store must be opened up.

In the weeks since, major apps like Spotify and Kindle have taken advantage of the ruling by adding links in their apps to make purchases on the web. Fortnite has returned, too, offering an option between Apple’s in-app payment system and Epic’s own payment and rewards program. Epic CEO Tim Sweeney told The Verge this week that there’s currently a 60-40 split in usage between the two systems, with Apple’s still winning out.

“We are disappointed with the decision not to stay the district court’s order, and we’ll continue to argue our case during the appeals process,” says Apple spokesperson Olivia Dalton. “As we’ve said before, we strongly disagree with the district court’s opinion. Our goal is to ensure the App Store remains an incredible opportunity for developers and a safe and trusted experience for our users.”`,
});

console.log('✅ Выпраўлены пераклад:');

// 6. Вывад усіх этапаў
console.log("📝 Арыгінальны тэкст:\n", result.originalText);
console.log("\n🌐 Пераклад і рэзюмэ:\n", result.translatedText);
console.log("\n✅ Выпраўлены пераклад:\n", result.correctedText);