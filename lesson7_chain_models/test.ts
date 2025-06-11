import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { chatModel, Model } from './model';
import { PromptSDK } from 'goman-live';
import { z } from 'zod';
// --- SDK and Model Initialization ---
const promptSdk = new PromptSDK({
    applicationId: 'appID87b9abb0d07b',
    apiKey: 'apkdf59b4097d660c2a8e38c9d2947085fb4a66f1234275eeeb0ac572c18bf00427',
});
const prompt_id = '6743a6431d6c21c6699b668f';
const mistakeFixPrompt = '684688a3b81fba04309d936b';

const model = await chatModel(Model.GPT4_1);
const translationPromptData = await promptSdk.getLangChainPrompt(prompt_id);
const correctionPromptData = await promptSdk.getLangChainPrompt(mistakeFixPrompt);

const schema = z.object({
    title: z.string().describe('Title of the news article'),
    belarussian_content: z
        .string()
        .describe('Belarussian translation of the news article'),
    english_content: z.string().describe('English version of the news article'),
    belarussian_title: z
        .string()
        .describe('Belarussian translation of the title'),
});
const structuredModel = model.withStructuredOutput(schema);

// Utility to check if prompt has a placeholder
const hasInputPlaceholder = (str: string, key: string) =>
    str.includes(`{${key}}`);

/**
 * Runs translation and correction chain.
 * @param model - The chat model instance.
 * @param inputText - The text to translate and correct.
 * @param translationPromptData - Object with .value for translation prompt.
 * @param correctionPromptData - Object with .value for correction prompt.
 * @returns The result object with originalText, translatedText, correctedText.
 */
export async function runTranslationCorrectionChain(
    model: any,
    inputText: string,
    translationPromptData: { value: string },
    correctionPromptData: { value: string }
) {
    const chain = RunnableSequence.from([
        // Step 1: Input normalization
        async (input: { input: string }) => {
            console.log('🔹 Step 1: Input:', input.input);
            return { input: input.input };
        },

        // Step 2: Translation and summary
        async (values: { input: string }) => {
            const promptText = translationPromptData.value;
            let translated: string;

            if (hasInputPlaceholder(promptText, 'input')) {
                const prompt = PromptTemplate.fromTemplate(promptText);
                translated = await prompt.pipe(model).invoke({ input: values.input }) as string;
            } else {
                translated = await model.invoke(`${promptText}\n\n${values.input}`);
            }

            translated = typeof translated === 'string'
                ? translated
                // @ts-ignore
                : translated?.content ?? translated;

            console.log('🔹 Step 2: Translated:', translated);
            return {
                input: values.input,
                translatedText: translated,
            };
        },

        // Step 3: Correction
        async (values: { input: string; translatedText: string }) => {
            const promptText = correctionPromptData.value;
            let corrected: string;

            if (hasInputPlaceholder(promptText, 'translatedText')) {
                const prompt = PromptTemplate.fromTemplate(promptText);
                corrected = await prompt.pipe(model).invoke({ translatedText: values.translatedText }) as string;
            } else {
                corrected = await model.invoke(`${promptText}\n\n${values.translatedText}`);
            }

            corrected = typeof corrected === 'string'
                ? corrected
                // @ts-ignore
                : corrected?.content ?? corrected;

            console.log('🔹 Step 3: Corrected:', corrected);
            return {
                originalText: values.input,
                translatedText: values.translatedText,
                correctedText: corrected,
            };
        },
    ]);

    return await chain.invoke({ input: inputText });
}

// --- Example Input ---
const inputText = `
At WWDC, Apple announced its new Liquid Glass design language, which is coming to all of its devices, including Macs. I’ve been tinkering with the macOS Tahoe 26 developer beta on the M4 MacBook Air for about a day. So far, the aesthetic changes range from slick to slightly overwrought, but the new Spotlight search features are nifty and useful.

There are new touches of glassy transparency all over macOS 26, including the Dock, Finder, widgets, and built-in apps. It’s more subtle than on the iPhone, mostly because the Mac’s much larger screen real estate makes the Liquid Glass elements more like accents than whatever this mess is supposed to be. I’m not very fond of it just yet, but maybe it will grow on me, like UI changes tend to.
The see-through dock can distort and refract what’s visible behind it.
The see-through dock can distort and refract what’s visible behind it. Screenshot: Antonio G. Di Benedetto / The Verge

The Dock now has a frosted background that’s more translucent than Sequoia’s flatter design. The hazy, frozen glass aesthetic also extends to widgets, like the calendar and weather, and drop-down menus — though the latter have much higher opacity. The pop-ups for volume and brightness now use this distorted glass look as well, though they’ve moved to the top-right corner of the screen instead of being centered above the dock. Frankly, they’re ugly, and I find their new elongated horizontal look strange and out of place.

Surprisingly, the Menu Bar at the top of the screen is now invisible, so it no longer masks the screen’s notch cutout with a dark gray bar. At first I found this slightly jarring, but I adjusted to it quickly, just as I did the first time I saw a notched MacBook. It became mostly innocuous with even a bright wallpaper showing its borders. (If you really hate it you can enable “Reduce transparency” in the accessibility menu, bringing back the filled-in Menu Bar and killing pretty much all of Tahoe’s other transparent effects.) The one cool thing the invisible Menu Bar enables is a new animation: when you three-finger swipe up for Mission Control, a glass pane descends from the top and distorts the view of the wallpaper underneath. It’s a kitschy flourish, but it’s one of the few effects in Tahoe that tickles me.
<em>The way this top pane in Mission Control distorts the wallpaper as it slides in is fun, I’ll give it that.</em>
<em>Control Center is much more bubbly and glass-like, as it is on iOS 26.</em>
<em>Widgets now live on the desktop instead of requiring a swipe-over of the Notification Center, allowing you to populate your desktop with lots of glanceable info like an iPad home screen if you choose.</em>

1/3The way this top pane in Mission Control distorts the wallpaper as it slides in is fun, I’ll give it that. Screenshot: Antonio G. Di Benedetto / The Verge

Widgets now live on the desktop instead of requiring a swipe-over of the Notification Center, allowing you to populate your desktop with lots of glanceable info like an iPad home screen if you choose. Open a Finder window and you see more of Tahoe’s rounded design, with the sidebar now looking like its own tall, oval-ish nested window. Dark mode and light mode show some differences here, with light mode flattening the Finder windows quite a bit more than its darker version, which looks more glassy to me.

The theme controls that launched with iOS 18 are now in macOS. Opening the Appearance menu lets you change Tahoe’s overall looks (light, dark, and auto), highlight colors, and icon and widget styles. The right (or wrong) combination of these settings can dramatically change macOS’s looks, from minimalist to garish.
<em>Open a Finder window and you see more of Tahoe’s rounded design, with the sidebar now looking like its own tall, oval-ish nested window.</em>
<em>Dark mode and light mode show some differences here, with light mode flattening the Finder windows quite a bit more than its darker version, which looks more glassy to me.</em>
<em>Here are some more of the various ways icons and backgrounds. can be changed in Finder</em>

1/5Open a Finder window and you see more of Tahoe’s rounded design, with the sidebar now looking like its own tall, oval-ish nested window. Screenshot: Antonio G. Di Benedetto / The Verge

More exciting for power users are the changes to Spotlight that make it much easier to operate your Mac by keyboard alone. Spotlight search now gives you shortcuts to finding files, launching apps, performing actions, and accessing clipboard history. Pressing Command and Space calls up Spotlight as it always has, but now if you hover over the search bar with the mouse you’re shown four icons for those new functions, with each offering a handy keyboard shortcut.

Now this is spotlighting: by pressing Command and either number 1, 2, 3, or 4 keys you can get quick access to Apps, Files, Shortcuts, and Clipboard. Then, you can type out whatever you’re searching for or trying to do. The Apps drawer can act as a mini categorized launcher. Files puts suggestions and recents at the top. Shortcuts allows you to type out functions you’d like your Mac to do via compatible apps. Clipboard is a reverse chronological history of the most recent stuff you copied.
Typing actions into Spotlight. You can see some of the quick keys I set up are suggested right at the top.
Typing actions into Spotlight. You can see some of the quick keys I set up are suggested right at the top. Screenshot: Antonio G. Di Benedetto / The Verge

I really like the ability to set custom quick key commands. For example, I set “M” to be the quick key for a message, and “TM” to set a timer. Each of those actions requires typing out some part of the prompt, like the number of minutes in your timer or the contents of a message and the recipient. But if you like to use lots of hotkeys and navigating around an app with the Tab and Alt keys you’re likely to feel right at home.
Related

    Apple’s new design language is Liquid Glass
    Apple’s Liquid Glass was a wild change to my iPhone
    WWDC 2025: all the news from Apple’s annual developer conference

Several readers were quick to comment that this is Apple “sherlocking” Raycast. Raycast is a much more customizable and expansive Spotlight alternative. It can do math and unit conversions, set timers, has its own appendable clipboard history, and a bunch more, and it also supports third-party extensions. While the changes in macOS Tahoe let Spotlight encroach on some of the things Raycast can do, it’s not quite as expansive. At least, not yet. Raycast is a power-user tool, and it could take Apple some time and a lot more development to win over those users.

I’ve been using the first Tahoe developer beta for about a day. There will be plenty more to learn about macOS Tahoe as developers continue using it in its current beta form and Apple delivers more updates. The public beta isn’t coming until sometime next month, and it’s possible that Apple will push out some sizable changes and UI tweaks even before then.
`;

// --- Chain Invocation ---
const result = await runTranslationCorrectionChain(
    structuredModel,
    inputText,
    translationPromptData,
    correctionPromptData
);

// --- Output ---
console.log('\n📝 Арыгінальны тэкст:\n', result.originalText);
console.log('\n🌐 Пераклад і рэзюмэ:\n', result.translatedText);
console.log('\n✅ Выпраўлены пераклад:\n', result.correctedText);
