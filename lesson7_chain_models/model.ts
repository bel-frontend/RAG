import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';

export enum Model {
    LLM3 = 'llama3.2',
    GPT4o = 'gpt-4o',
    GPT4_1 = 'gpt-4.1-2025-04-14',
    MISTRAL = 'mistral-small3.1',
    LLAMA3_3 = 'llama3.3:latest',
    GEMMA3_12 = 'gemma3:12b',
}

export async function chatModel(model = Model.LLM3) {
    let chatModel:any = null;
    switch (model) {
        case Model.GPT4o:
            chatModel = new ChatOpenAI({
                model: Model.GPT4o,
                temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
            });
            break;
        case Model.GPT4_1:
            chatModel = new ChatOpenAI({
                model: Model.GPT4_1,
                temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
            });
            break;
        default:
            chatModel = new ChatOllama({
                model: model,
                baseUrl: 'http://localhost:11434',
            });
    }
    return chatModel;
}
