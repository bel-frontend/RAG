import { createCollection } from "./qdrant/embeddings";
import { OPENAI_DIM } from "./openai/embeddings";

createCollection("test_collection");

// createCollection("test_collection", OPENAI_DIM);
