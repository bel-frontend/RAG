import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';

export enum Model {
    LLM3 = 'llama3.2',
    GPT4o = 'gpt-4o',
    MISTRAL = 'mistral-small3.1',
    GEMMA3_27B = 'gemma3:27b',
    GEMMA3_12B = 'gemma3:12b',
    PHI4 = 'phi4:latest',
    LLAMA3_3 = 'llama3.3:latest',
}

export async function chatModel(model = Model.LLM3) {
    let chatModel: ChatOpenAI | ChatOllama | null = null;
    switch (model) {
        case Model.GPT4o:
            chatModel = new ChatOpenAI({
                model: Model.GPT4o,
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
