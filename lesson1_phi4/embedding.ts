import { addDocToSearch } from "./qdrant/embeddings";
import { embeddingsModel } from "./ollama/embeddings";

// is openai  embedding
addDocToSearch({
  embeddingsModelExternal: embeddingsModel,
});

// is default  embedding - phi4
// addDocToSearch();
