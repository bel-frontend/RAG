import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { embeddingsModel, OPENAI_DIM } from "../openai/embeddings.js";
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

export const createCollection = async (
  collectionName: string,
  dim: number = OPENAI_DIM,
) => {
  const qdrant = new QdrantClient();
  return await qdrant.createCollection(collectionName, dim);
};

const defaultOptions = {
  collectionName: "test_collection",
  embeddingsModelExternal: embeddingsModel,
};

interface optionsInterface {
  collectionName?: string;
  embeddingsModelExternal?: (x?: any) => Promise<any>;
}

const BATCH_SIZE = 100; // Define the batch size

export const addDocToSearch = async (options?: optionsInterface) => {
  try {
    const { collectionName, embeddingsModelExternal } = {
      ...defaultOptions,
      ...options,
    };

    const docs = await loadPDFDocuments("./pdf_documents/");
    const splitDocs = await splitDocuments(docs);
    const vectorStore = await embeddingsModelExternal();
    const qdrant = new QdrantClient();

    // Helper function to process batches
    const processBatch = async (batch: any[], batchIndex: number) => {
      const points = await Promise.all(
        batch.map(async (doc, index) => {
          const text = doc.pageContent;
          const metadata = doc.metadata;
          metadata.text = text; // Add the text to the metadata
          const vector = await vectorStore.embedQuery(text);
          const generated_id = generateUniqueId(); // Generate a unique ID for the point

          // Log progress
          console.clear();
          console.log(
            `Embedding document ${batchIndex * BATCH_SIZE + index + 1} of ${splitDocs.length}`,
          );

          return {
            id: generated_id,
            vector,
            payload: metadata,
          };
        }),
      );

      // Insert the batch into Qdrant
      const res = await qdrant.insertPoints(collectionName, points);
      console.log(`Inserted batch ${batchIndex + 1}:`, res);
    };

    // Split documents into batches and process each batch
    for (let i = 0; i < splitDocs.length; i += BATCH_SIZE) {
      const batch = splitDocs.slice(i, i + BATCH_SIZE);
      await processBatch(batch, i / BATCH_SIZE);
    }

    console.log("All points inserted successfully.");
  } catch (error) {
    console.error("Error in addDocToSearch:", error);
  }
};

export const searchString = async (
  query: string,
  countResults: number = 5,
  options?: optionsInterface,
): Promise<{
  text: string;
  score: number;
  pdf: Record<string, any>;
  source: string;
  [key: string]: any;
}> => {
  const qdrant = new QdrantClient();

  const { collectionName, embeddingsModelExternal } = {
    ...defaultOptions,
    ...options,
  };
  const vectorStore = await embeddingsModelExternal();

  const vector = await vectorStore.embedQuery(query);
  console.log("vector size:", vector.length);

  const res = await qdrant.search(collectionName, vector, countResults);
  return res.result.map((item: any) => ({
    ...item.payload,
    score: item.score,
  }));
};
