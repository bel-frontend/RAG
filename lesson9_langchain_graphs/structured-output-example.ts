/**
 * LangChain v1 - Структураваны вывад
 * 
 * Гэты прыклад дэманструе:
 * - Выкарыстанне Zod для вызначэння схем
 * - withStructuredOutput для гарантаванага фармату
 */

import { z } from 'zod';
import { chatModel, Model } from '../common/model';
import { config } from 'dotenv';
import { resolve } from 'path';

// Загрузка .env з бацькоўскай тэчкі
config({ path: resolve(__dirname, '../.env') });

// ============================================
// 📋 Схемы Zod
// ============================================

// Схема для аналізу настрою
const SentimentAnalysisSchema = z.object({
    text: z.string().describe('Арыгінальны тэкст'),
    sentiment: z.enum(['positive', 'negative', 'neutral']).describe('Агульны настрой'),
    confidence: z.number().min(0).max(1).describe('Упэўненасць ад 0 да 1'),
    emotions: z.array(z.object({
        emotion: z.string().describe('Назва эмоцыі'),
        intensity: z.number().min(0).max(1).describe('Інтэнсіўнасць эмоцыі'),
    })).describe('Спіс выяўленых эмоцый'),
    summary: z.string().describe('Кароткае апісанне аналізу'),
});

// Схема для рэкамендацыі прадукту
const ProductRecommendationSchema = z.object({
    productName: z.string().describe('Назва прадукту'),
    category: z.string().describe('Катэгорыя прадукту'),
    price: z.number().describe('Кошт у даларах'),
    rating: z.number().min(1).max(5).describe('Рэйтынг ад 1 да 5'),
    pros: z.array(z.string()).describe('Перавагі прадукту'),
    cons: z.array(z.string()).describe('Недахопы прадукту'),
    recommendation: z.string().describe('Агульная рэкамендацыя'),
});

// Схема для структураванага плана праекта
const ProjectPlanSchema = z.object({
    projectName: z.string().describe('Назва праекта'),
    description: z.string().describe('Апісанне праекта'),
    duration: z.object({
        value: z.number().describe('Працягласць'),
        unit: z.enum(['days', 'weeks', 'months']).describe('Адзінка вымярэння'),
    }),
    phases: z.array(z.object({
        name: z.string().describe('Назва этапу'),
        tasks: z.array(z.string()).describe('Задачы этапу'),
        duration: z.string().describe('Працягласць этапу'),
    })),
    technologies: z.array(z.string()).describe('Тэхналогіі'),
    estimatedCost: z.object({
        min: z.number().describe('Мінімальны кошт'),
        max: z.number().describe('Максімальны кошт'),
        currency: z.string().describe('Валюта'),
    }),
});

// ============================================
// 🤖 Ініцыялізацыя мадэлі
// ============================================

const model = await chatModel(Model.GPT4o_MINI);

// ============================================
// 🎯 Прыклады выкарыстання
// ============================================

async function analyzeSentiment(text: string) {
    console.log('\n📊 АНАЛІЗ НАСТРОЮ');
    console.log('═'.repeat(50));
    console.log(`Тэкст: "${text}"`);
    console.log('─'.repeat(50));

    const structuredModel = model.withStructuredOutput(SentimentAnalysisSchema);

    const result = await structuredModel.invoke([
        { role: 'system', content: 'Ты эксперт па аналізе настрою тэксту. Аналізуй тэкст і вызначай эмоцыі.' },
        { role: 'user', content: `Прааналізуй настрой гэтага тэксту: "${text}"` },
    ]);

    console.log('\n✅ Вынік:');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
}

async function getProductRecommendation(userRequest: string) {
    console.log('\n🛒 РЭКАМЕНДАЦЫЯ ПРАДУКТУ');
    console.log('═'.repeat(50));
    console.log(`Запыт: "${userRequest}"`);
    console.log('─'.repeat(50));

    const structuredModel = model.withStructuredOutput(ProductRecommendationSchema);

    const result = await structuredModel.invoke([
        { role: 'system', content: `Ты эксперт па тэхналагічных прадуктах. 
Рэкамендуй прадукты на аснове патрэб карыстальніка.
Давай рэалістычныя цэны і ацэнкі.` },
        { role: 'user', content: userRequest },
    ]);

    console.log('\n✅ Рэкамендацыя:');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
}

async function createProjectPlan(projectDescription: string) {
    console.log('\n📋 ПЛАН ПРАЕКТА');
    console.log('═'.repeat(50));
    console.log(`Апісанне: "${projectDescription}"`);
    console.log('─'.repeat(50));

    const structuredModel = model.withStructuredOutput(ProjectPlanSchema);

    const result = await structuredModel.invoke([
        { role: 'system', content: `Ты вопытны праектны менеджар. 
Ствары дэталёвы план праекта на аснове апісання.
Улічвай рэалістычныя тэрміны і бюджэт.` },
        { role: 'user', content: `Стварыць план праекта: ${projectDescription}` },
    ]);

    console.log('\n✅ План праекта:');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
}

// ============================================
// 🚀 Галоўная функцыя
// ============================================

async function main() {
    console.log('🎯 LangChain v1 - Структураваны вывад');
    console.log('═'.repeat(50));

    // Прыклад 1: Аналіз настрою
    await analyzeSentiment(
        'Гэты новы тэлефон проста выдатны! Камера робіць цудоўныя здымкі, але батарэя магла б быць лепшай.'
    );

    // Прыклад 2: Рэкамендацыя прадукту
    await getProductRecommendation(
        'Мне патрэбен ноўтбук для праграмавання з добрай клавіятурай, бюджэт да 1500 даляраў'
    );

    // Прыклад 3: План праекта
    await createProjectPlan(
        'Мабільнае прыкладанне для дастаўкі ежы з падтрымкай аплаты картай'
    );
}

main().catch(console.error);
