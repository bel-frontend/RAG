import { OpenAIEmbeddings } from "@langchain/openai";

export const OPENAI_DIM = 3072;

export async function embeddingsModel(model = "text-embedding-3-large") {
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY, // In Node.js defaults to process.env.OPENAI_API_KEY
    batchSize: 512, // Default value if omitted is 512. Max is 2048
    model: "text-embedding-3-large",
  });

  return embeddings;
}
