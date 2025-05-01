import { ChatOllama } from "@langchain/ollama";

export async function chatModel(model = "phi4:latest") {
  const chatModel = new ChatOllama({
    model: model,
    baseUrl: "http://localhost:11434", //Default value
  });
  return chatModel;
}
