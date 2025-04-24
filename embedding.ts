import { addDocToSearch } from "./qdrant/embeddings";
import { embeddingsModel } from "./openai/embeddings";

// is openai  embedding
// addDocToSearch({
//   embeddingsModelExternal: embeddingsModel,
// });

// is default  embedding - phi4
addDocToSearch();
