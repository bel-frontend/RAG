import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";

export enum Model {
  LLM3 = "llama3.2",
  GPT4o = "gpt-4o",
  PHI4 = "phi4:latest",
}


export async function chatModel(model = Model.PHI4) {
  let chatModel = null;
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
        baseUrl: "http://localhost:11434", 
      });
    }
    return chatModel;
}






