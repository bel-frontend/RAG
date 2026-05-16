import { config } from './config';
import { createEmbeddings } from './embeddings';
import { DialectDictionarySearchTool } from './agents/dialectDictionarySearchTool';
import { FolkWisdomSearchTool } from './agents/folkWisdomSearchTool';
import { RagSearchAgent } from './agents/ragSearchAgent';
import { QdrantClient } from './qdrant/client';
import { HybridRetriever } from './rag/hybridRetriever';
import { LexicalRetriever } from './rag/lexicalRetriever';
import { QdrantRetriever } from './rag/retriever';

const args = process.argv.slice(2);
const useFolkTool = args.includes('--folk');
const useDialectTool = args.includes('--dialect');
const query = args.filter((arg) => arg !== '--folk' && arg !== '--dialect').join(' ').trim();

if (!query) {
  console.error('Usage: bun run search -- [--folk|--dialect] "your query"');
  process.exit(1);
}

const qdrant = new QdrantClient(config.qdrant.url, config.qdrant.apiKey);
const retriever = new HybridRetriever(
  new QdrantRetriever(qdrant, createEmbeddings()),
  new LexicalRetriever(qdrant)
);

const result = useDialectTool
  ? await new DialectDictionarySearchTool(retriever).invoke(query)
  : useFolkTool
    ? await new FolkWisdomSearchTool(retriever).invoke(query)
    : await new RagSearchAgent(retriever).search(query);

console.log(
  `Tool: ${useDialectTool ? 'dialect_dictionary_search' : useFolkTool ? 'folk_wisdom_search' : 'rag_search'}`
);
console.log(`Collection: ${config.qdrant.collection}`);
console.log(`Min score: ${config.search.minScore}`);
console.log(`Found: ${result.sourceCount}`);
console.log(`Query: ${result.query}`);

for (const [index, source] of result.sources.entries()) {
  console.log('\n---');
  console.log(`#${index + 1} score=${source.score.toFixed(4)} file=${source.fileName || 'unknown'} page=${source.page || '-'}`);
  console.log(source.text.slice(0, 700).replace(/\s+/g, ' '));
}
