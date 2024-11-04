import OpenAI from "openai";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { logger } from "../helpers/logger";
import { get_embedding } from "./pineconeService";

class QuestionAnswerAgent {

    constructor() {
    }
    static async build_template(context:string = "", query: string = "") {
        const prompt = `You are an expert in state of the union topics. You are provided multiple context items that are related to the prompt you have to answer. Use the following pieces of context to answer the question at the end.\n\nContext: ${context} \n\n\n\nQuestion: ${query}\nAnswer:  `;
        return prompt;
    }

    async construct_llm_payload(query:string, context_chunks:string []) {
    
    }

    async get_answer(query: string) {
        logger.info(`Getting answer for prompt: ${query}`);
        const pinecone = new PineconeClient();
        const index = pinecone.index("siteware").namespace('agent');

        const res = await get_embedding(query);
        logger.info(`Query Embedding Length ${res.length}`);
        const query_result = await index.query({
            topK: 4,
            vector: res,
            includeMetadata: true,
            includeValues: true,
        });
        const context_chunks = await query_result.matches.map((match: any) => match.metadata.text || '' );
        const context_text = context_chunks.join("\n");

        const prompt = await QuestionAnswerAgent.build_template(context_text,query);
        const model = new ChatOpenAI({
            model: "gpt-4o",
            streaming: true,
          });
        const result = await model.invoke(prompt);
        console.log(result["content"]);
        return result["content"]
    }
}

export { QuestionAnswerAgent };