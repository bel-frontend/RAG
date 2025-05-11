import { addDocToSearch } from './qdrant/embeddings';
import { embeddingsModel } from './openai/embeddings';
import { COLLECTION_NAME } from './qdrant/collection';

addDocToSearch({
    embeddingsModelExternal: embeddingsModel,
    collectionName: COLLECTION_NAME,
});
