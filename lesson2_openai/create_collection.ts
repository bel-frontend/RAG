import { createCollection } from "./qdrant/embeddings";
import { OPENAI_DIM } from "./openai/embeddings";

createCollection("openai_collection", OPENAI_DIM);
