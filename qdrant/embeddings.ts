import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantClient } from "./api";
import { v4 as uuidv4 } from "uuid";
import { loadPDFDocuments } from "../pdf_loader/pdf-loader.js";

const generateUniqueId = () => {
  // Generate a unique ID using uuidv4
  return uuidv4();
};

async function splitDocuments(docs: any[]) {
  console.log("Splitting PDFs into text chunks...");
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitDocs = await textSplitter.splitDocuments(docs);
  console.log(
    `Split into ${splitDocs.length} text chunks using recursive character splitting.`,
  );
  return splitDocs;
}

export async function initializeVectorStore() {
  const embeddings = await new OllamaEmbeddings({
    model: "phi4:latest", // Default value
    baseUrl: "http://localhost:11434", // Default value
  });
  return embeddings;
}

export const addDocToSearch = async (
  collectionName: string = "test_collection",
) => {
  try {
    const docs = await loadPDFDocuments("./pdf_documents/");
    const splitDocs = await splitDocuments(docs);
    const vectorStore = await initializeVectorStore();
    const qdrant = new QdrantClient();
    const dim = 5120; // Set the dimension of your embeddings
    qdrant.createCollection(collectionName, dim);

    const res = await qdrant.insertPoints(
      collectionName,
      await Promise.all(
        splitDocs.map(async (doc, index) => {
          const text = doc.pageContent;
          const metadata = doc.metadata;
          metadata.text = text; // Add the text to the metadata
          const vector = await vectorStore.embedQuery(text);
          const generated_id = generateUniqueId(); // Generate a unique ID for the point

          // Log progress
          console.clear();
          console.log(`Embedding document ${index + 1} of ${splitDocs.length}`);

          return {
            id: generated_id,
            vector,
            payload: metadata,
          };
        }),
      ),
    );

    console.log("Inserted points:", res);
  } catch (error) {
    console.error("Error in addDocToSearch:", error);
  }
};

export const searchString = async (
  query: string,
  countResults: number = 5,
  collectionName: string = "test_collection",
): Promise<{
  text: string;
  score: number;
  pdf: Record<string, any>;
  source: string;
  [key: string]: any;
}> => {
  const qdrant = new QdrantClient();
  const vectorStore = await initializeVectorStore();

  const vector = await vectorStore.embedQuery(query);

  const res = await qdrant.search(collectionName, vector, countResults);
  return res.result.map((item: any) => ({
    ...item.payload,
    score: item.score,
  }));
};
