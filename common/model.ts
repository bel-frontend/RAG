import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';

export enum Model {
    // OpenAI Models
    GPT4o = 'gpt-4o',
    GPT4o_MINI = 'gpt-4o-mini',
    GPT4_1 = 'gpt-4.1-2025-04-14',
    GPT5 = 'gpt-5',
    GPT5_MINI = 'gpt-5-mini',
    GPT5_1 = 'gpt-5.1',
    GPT5_1_MINI = 'gpt-5.1-mini',
    GPT5_1_NANO = 'gpt-5.1-nano',
    O3_MINI = 'o3-mini',
    O3 = 'o3',
    O4_MINI = 'o4-mini',

    // Ollama / Local Models
    LLM3 = 'llama3.2',
    LLAMA3_3 = 'llama3.3:latest',
    GPT_OSS_20B = 'gpt-oss:20b', // мадэль думаючая таму вельмі павольная
    MISTRAL = 'mistral-small3.1',
    GEMMA3_27B = 'gemma3:27b',
    GEMMA3_12B = 'gemma3:12b',
    GEMMA3_12 = 'gemma3:12b',
    PHI4 = 'phi4:latest',
    QWEN3 = 'qwen3:32b',
    DEEPSEEK = 'deepseek-r1:32b',
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
                openAIApiKey: process.env.OPENAI_API_KEY,
                useResponsesApi: true,
                reasoning: { effort: 'low' },
            });
            break;
        case Model.O3:
            chatModelInstance = new ChatOpenAI({
                model: Model.O3,
                openAIApiKey: process.env.OPENAI_API_KEY,
                useResponsesApi: true,
                reasoning: { effort: 'medium' },
            });
            break;
        case Model.O4_MINI:
            chatModelInstance = new ChatOpenAI({
                model: Model.O4_MINI,
                openAIApiKey: process.env.OPENAI_API_KEY,
                useResponsesApi: true,
                reasoning: { effort: 'low' },
            });
            break;
        case Model.GPT5_1:
            chatModelInstance = new ChatOpenAI({
                model: Model.GPT5_1,
                temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
                reasoning: { effort: 'none' },
            });
            break;
        case Model.GPT5_1_MINI:
            chatModelInstance = new ChatOpenAI({
                model: Model.GPT5_1_MINI,
                temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
            });
            break;
        case Model.GPT5_1_NANO:
            chatModelInstance = new ChatOpenAI({
                model: Model.GPT5_1_NANO,
                temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
            });
            break;
        case Model.GPT4o_MINI:
            chatModelInstance = new ChatOpenAI({
                model: Model.GPT4o_MINI,
                temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
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
