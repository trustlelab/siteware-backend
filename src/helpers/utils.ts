import fs from "fs";
import pdfParse from "pdf-parse";

import {Tiktoken ,get_encoding } from "tiktoken";
import {
    RecursiveCharacterTextSplitter,
  } from "langchain/text_splitter";
import { logger } from "./logger";

  // Encoding name
const encoding = "o200k_base"
const tokenizer = get_encoding(encoding);
const model = "gpt-4o";

// Create the length function by tokenizer

const length = (text: string) => {
    const tokens = tokenizer.encode(text)
    return tokens.length
};


// Convert PDF to text
export async function pdf2text(filePath: string): Promise<string> {
    // Check if file exists before attempting to read
    if (!fs.existsSync(filePath)) {
        console.warn(`File at path ${filePath} does not exist. Skipping.`);
    }
    try {
        // Read the file content and process it
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);

        // console.log(`Extracted Text for :`, pdfData.text);
        return pdfData.text;
    } 
    catch (fileReadError) {
        const error_msg = `Error reading or parsing file with uuid : ${fileReadError}`;
        return error_msg
    }
}
// Convert txt to text
export async function txt2text(filePath: string): Promise<string> {
    // Check if file exists before attempting to read
    if (!fs.existsSync(filePath)) {
        console.warn(`File at path ${filePath} does not exist. Skipping.`);
    }   
    try {
        // Read the file content and process it
        const dataBuffer = fs.readFileSync(filePath);
        const text = dataBuffer.toString();
        return text;
    }
    catch (fileReadError) {
        const error_msg = `Error reading or parsing file with uuid : ${fileReadError}`;
        return error_msg
    }
}

// splitTextIntoChunks
export async function splitTextIntoChunks(text: string): Promise<string[]> {
    const text_splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 400,
        chunkOverlap: 20,
        lengthFunction: await length,
        separators: ["\n\n", "\n", " ", ""]
    });
    let chunks = await text_splitter.splitText(text);

    // Filter out chunks that are too small
    chunks = chunks.filter(chunk => length(chunk) >= 200);

    logger.info(`Splitting text into chunks ${chunks.length}...`);
    
    return chunks;
}
