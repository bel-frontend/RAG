import { addDocToSearch } from "./qdrant/embeddings";
import { embeddingsModel } from "./openai/embeddings";

// is openai  embedding
addDocToSearch({
  embeddingsModelExternal: embeddingsModel,
  collectionName: "openai_collection",
});

// is default  embedding - phi4
// addDocToSearch();
