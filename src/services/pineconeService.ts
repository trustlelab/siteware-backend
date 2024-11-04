// Import the Pinecone library
import { Pinecone } from '@pinecone-database/pinecone';
import { pdf2text, splitTextIntoChunks, txt2text } from '../helpers/utils';

import {logger} from '../helpers/logger';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: PINECONE_API_KEY as string });


interface DocumentRecord {
  id: string;
  values: number[];
  metadata: { text: string };
}

// async function initializeVectorStore(index_name: string) {
//   const vectorStore = await PineconeStore.fromExistingIndex(pc, index_name);
//   return vectorStore;
// }

// initializeVectorStore().then(() => {
//   logger.info('Vector store initialized successfully.');
// }).catch((error) => {
//   logger.error('Error initializing vector store:', error);
// });

// Get embeddings for a chunk of text
export async function get_embedding(chunk: string) {
    // Get embeddings for a chunk of text
    const model = 'multilingual-e5-large';
    const embeddings = await pc.inference.embed(model, [chunk], { inputType: 'passage', truncate: 'END' });
    return embeddings[0]?.values || [];
}

// Create a new index in Pinecone
export async function createIndex(index_name: string) {
  const response = await pc.createIndex({
    name: index_name,
    dimension: 1024,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1'
      }
    },
    deletionProtection: 'disabled',
  });
    return response;
}

// Delete index from Pinecone
export async function deleteIndex(index_name: string) {
  const response   = await pc.deleteIndex(index_name);  
  return response;
}

// Embed chunks and upload to pinecone
export async function uploadToPinecone(documents: string [], index_name: string) {
    // Convert the text into numerical vectors that Pinecone can index
    const model = 'multilingual-e5-large';
    const batchSize = 90;  // Adjust batch size as needed
    logger.info(`Uploading ${documents.length} embeddings to Pinecone...`);

    // Batch processing embeddings
    const batchProcessEmbeddings = async (documents: string[], batchSize: number) => {
      const embeddings = [];
      for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          logger.info(`Processing batch ${i / batchSize + 1} of ${Math.ceil(documents.length / batchSize)}`);
          const batchEmbeddings = await pc.inference.embed(
              model,
              batch,
              { inputType: 'passage', truncate: 'END' }
          );
          embeddings.push(...batchEmbeddings);
      }
      return embeddings;
    };

    // This code made error msg : Input length '793' exceeded inputs limit of 96 for model 'multilingual-e5-large'
    // const embeddings = await pc.inference.embed(
    //   model,
    //   documents,
    //   { inputType: 'passage', truncate: 'END' }
    // );

    // Process documents in batches(Updated code)
    const embeddings = await batchProcessEmbeddings(documents, batchSize);
    logger.info(`Processed ${embeddings.length} embeddings.`);

    const records = documents.map((doc, i) => ({
      id: `doc_${i}`,
      values: embeddings[i].values,
      metadata: { text: doc}
    }));

    logger.info(`Mapped ${documents.length} embeddings to Pinecone format.`);
    const index = pc.Index(index_name);
    
    // Upsert the vectors into the index
    const upsertBatchSize = 100;  // Adjust batch size as needed
    // Helper function to batch upsert records
    const batchUpsert = async (records: DocumentRecord[], upsertBatchSize: number): Promise<void> => {
      for (let i = 0; i < records.length; i += upsertBatchSize) {
          const batch = records.slice(i, i + upsertBatchSize);
          logger.info(`Upserting batch ${Math.floor(i / upsertBatchSize) + 1} of ${Math.ceil(records.length / upsertBatchSize)}`);
          
          try {
              const response = await index.namespace('agent').upsert(batch as any);
              logger.info(`Batch upsert response: ${JSON.stringify(response)}`);
          } catch (error) {
              logger.error(`Error upserting batch ${Math.floor(i / upsertBatchSize) + 1}: ${error}`);
          }
      }
    };

    // Call batchUpsert with your records
    const response = await batchUpsert(records as DocumentRecord [], upsertBatchSize);
    // const response  = await index.namespace('agent').upsert(records as any);
    logger.info(`Uploaded ${documents.length} embeddings to Pinecone.`);
    logger.info(`Response: ${JSON.stringify(response)}`);
    return response;
}

// Query Pinecone for similar chunks
export async function queryPinecone(query: string, index_name: string) {
    // Convert the query into a numerical vector
    const model = 'multilingual-e5-large';
    const query_embedding = await pc.inference.embed(model, [query], { inputType: 'passage', truncate: 'END' });
    // Query the index for similar vectors
    const index = pc.Index(index_name);
    const response = await index.namespace('agent').query({ 
      vector: query_embedding[0]?.values || [],
      topK: 5,
      includeValues: true
    });
    return response;
}

// Convert file to Pinecone
export async function convertToPinecone(file_path: string, index_name: string) {
    // const text_contents = await pdf2text(file_path);
    const text_contents = await txt2text(file_path);

    logger.info(`Start splitting text into chunks...`);
    const documents = await splitTextIntoChunks(text_contents);
    logger.info(`Uploading ${documents.length} any to Pinecone...`);

    // Remove empty document and repeated document from documents
    const unique_documents = [...new Set(documents)];

    // Export document length list to CSV file

    let overtoken = 0, lesstoken = 0;
    for (let i = 0; i < unique_documents.length; i++) {
      if(unique_documents[i].length > 500) {
        overtoken++;
      }
      else {
        console.log('--------------------------------------');  
        console.log(unique_documents[i]);  
        lesstoken++;
      }
    }
    logger.info(`Over 1000 characters: ${overtoken}`);
    logger.info(`Less 1000 characters: ${lesstoken}`);
    logger.info(`Unique documents: ${unique_documents.length}`);


    const response = await uploadToPinecone(unique_documents, index_name);
    return response;
}