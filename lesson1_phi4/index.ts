import { searchString } from "./qdrant/embeddings";
import { embeddingsModel } from "./ollama/embeddings";
import ollama from "ollama";

const promptQuery = "Што вядома пра one-shot";

const res = await searchString(promptQuery, 10, {
  embeddingsModelExternal: embeddingsModel,
});

console.log(
  "Search results:",
  res.map((item) => ({
    role: "system",
    content: item.text,
    score: item.score,
  })),
);

const response = await ollama.chat({
  // model: "gemma3:27b",
  model: "gemma3:12b",
  messages: [
    {
      role: "system",
      content:
        "Ты - эксперт у галіне штучнага інтэлекту. Адказвай на пытанні па-беларуску, Улічвай прадстаўленыя дадзеныя як аснову адказу. Адказвай поўнымі адказамі і на ўсе пытанні",
    },
    {
      role: "system",
      content:
        "Твой адказ павінен быць заснаваны толькі на прадстаўленай інфармацыі.:",
    },
    ...res.map((item) => ({
      role: "system",
      content: item.text,
    })),
    {
      role: "user",
      content: promptQuery,
    },
  ],
});

console.log("Response:", response.message.content);
