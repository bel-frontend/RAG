import { addDocToSearch, searchString } from "./qdrant/embeddings";
import { Ollama } from "ollama";
import ollama from "ollama";

// addDocToSearch();

const promptQuery =
  "напішы мне прыклады якія ты ведаеш";

const res = await searchString(promptQuery);
console.log(
  "Search results:",
  res.map((item) => ({
    role: "system",
    content: item.text,
  })),
);

console.log(promptQuery);

const response = await ollama.chat({
  model: "gemma3:27b",
    // model: "gemma3:12b",
  messages: [
    {
      role: "system",
      content:
        "Ты - эксперт у галіне штучнага інтэлекту ды промпт-дызайну. Адказвай на пытанні па-беларуску, Улічвай прадстаўленыя дадзеныя як аснову адказу. Адказвай поўнымі адказамі і на ўсе пытанні",
    },
    {
      role: "system",
      content:
        "Твой адказ павінен быць заснаваны толькі на прадстаўленай інфармацыі.:",
    },



    {
      role: "user",
      content: `Запыт карыстальніка: ${promptQuery}`,
    },
  ],
});

console.log("Response:", response.message.content);
