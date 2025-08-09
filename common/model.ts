import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';

export enum Model {
    LLM3 = 'llama3.2',
    GPT4o = 'gpt-4o',
    GPT5 = 'gpt-5',
    GPT5_MINI = 'gpt-5-mini',
    GPT4_1 = 'gpt-4.1-2025-04-14',
    O3_MINI = 'o3-mini',

    GPT_OSS_20B = 'gpt-oss:20b', // мадэль думаючая  таму вельмі павольная
    MISTRAL = 'mistral-small3.1',
    GEMMA3_27B = 'gemma3:27b',
    GEMMA3_12B = 'gemma3:12b',
    GEMMA3_12 = 'gemma3:12b',
    PHI4 = 'phi4:latest',
    LLAMA3_3 = 'llama3.3:latest',
}

export async function chatModel(
    model = Model.LLM3
): Promise<ChatOpenAI | ChatOllama> {
    let chatModelInstance: ChatOpenAI | ChatOllama;

    switch (model) {
        case Model.GPT4o:
            chatModelInstance = new ChatOpenAI({
                model: Model.GPT4o,
                temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
            });
            break;
        case Model.GPT5:
            chatModelInstance = new ChatOpenAI({
                model: Model.GPT5,
                temperature: 1,
                openAIApiKey: process.env.OPENAI_API_KEY,
                //@ts-ignore
                // useResponsesApi: true,
                // reasoning: { effort: 'minimal' },
            });
            break;
        case Model.GPT5_MINI:
            chatModelInstance = new ChatOpenAI({
                model: Model.GPT5_MINI,
                temperature: 1,
                openAIApiKey: process.env.OPENAI_API_KEY,
            });
            break;
        case Model.GPT4_1:
            chatModelInstance = new ChatOpenAI({
                model: Model.GPT4_1,
                temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
            });
            break;
        case Model.O3_MINI:
            chatModelInstance = new ChatOpenAI({
                model: Model.O3_MINI,
                // temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
                useResponsesApi: true,
                reasoning: { effort: 'low' },
            });
            break;
        default:
            chatModelInstance = new ChatOllama({
                model: model,
                baseUrl: 'http://localhost:11434',
            });
    }

    return chatModelInstance;
}
