import { OllamaEmbeddings } from "@langchain/ollama";

export async function embeddingsModel(model = "phi4:latest") {
  const embeddings = new OllamaEmbeddings({
    model: model,
    baseUrl: "http://localhost:11434", // Default value
  });
  return embeddings;
}

export const PHI4_DIMM = 5120;
