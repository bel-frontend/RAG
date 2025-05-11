import { createCollection } from './qdrant/embeddings';
import { OPENAI_DIM } from './openai/embeddings';
import { COLLECTION_NAME } from './qdrant/collection';

createCollection(COLLECTION_NAME, OPENAI_DIM);
