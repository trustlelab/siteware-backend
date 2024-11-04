import { Request, Response } from 'express';
import { createIndex, deleteIndex, uploadToPinecone, convertToPinecone } from '../services/pineconeService';

// Create Vector Index in pinecone 
export const createVectorIndex = async (req: Request, res: Response): Promise<void> => {
  const { index_name } = req.body as { index_name: string }; // Access the "index_name" field in the JSON body
  const response = await createIndex(index_name);
  res.status(200).json({ status: 1, message: `Index ${index_name} created successfully` });
};

// Delete Vector Index in pinecone
export const deleteVectorIndex = async (req: Request, res: Response): Promise<void> => {
    const { index_name } = req.body as { index_name: string }; // Access the "index_name" field in the JSON body
    const response = await deleteIndex(index_name);
    res.status(200).json({ status: 1, message: `Index ${index_name} deleted successfully` });
};


// Upload data to Vector Index in pinecone
export const uploadDataToVectorIndex = async (req: Request, res: Response): Promise<void> => {
    const { chunk_list, index_name } = req.body as { chunk_list: any[], index_name: string }; // Access the "chunk_list" and "index_name" fields in the JSON body
    const response = await uploadToPinecone(chunk_list, index_name);
    res.status(200).json({ status: 1, message: `Data uploaded to index ${index_name} successfully` });
};

// Add documents to Vector Index in pinecone
export const addDocumentsToVectorIndex = async (req: Request, res: Response): Promise<void> => {

    const response = await convertToPinecone("./test.txt", "siteware");

    res.status(200).json({ status: 1, message: `Successfully Inserted` });
};