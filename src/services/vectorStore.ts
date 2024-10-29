import { Pinecone } from '@pinecone-database/pinecone';

// Create a serverless index
// "dimension" needs to match the dimensions of the vectors you upsert
const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string
});

const EMBEDDING_DIMENSION: number = 1536;

async function get_most_similarity_chunks_for_query(query: string): Promise<void> {
    const query_embedding = await get_embedding(query);
    await vector_search(query_embedding);
}


// Asynchronous function to create the index
async function createIndex() {
    const index = await pc.createIndex({
        name: 'example-index',
        dimension: 1536,
        metric: 'cosine',
        spec: {
            serverless: {
                cloud: 'aws',
                region: 'us-east-1'
            }
        }
    });
    return index;
}

// Asynchronous function for vector search
async function vector_search(query: number[]): Promise<void> {
    const index = await createIndex();
    try {
        const response = await index.query({
            query: {
                vector: query
            },
            top_k: 5
        });
        console.log(response.data);
    } catch (error) {
        console.error('Error performing vector search:', error);
    }
}
