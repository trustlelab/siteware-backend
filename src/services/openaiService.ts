import OpenAI from "openai";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = 'text-embedding-ada-002'
const PROMPT_LIMIT = 3750
const CHATGPT_MODEL = 'gpt-4-1106-preview'

const openai = new OpenAI();

// Get embeddings for a chunk of text
async function get_embedding(chunk: string) {
    // Get embeddings for a chunk of text
    const url: string = 'https://api.openai.com/v1/embeddings';
    const headers: Record<string, string> = {
        'content-type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
    };
    const data: { model: string; input: string } = {
        model: OPENAI_EMBEDDING_MODEL,
        input: chunk
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        const response_json = await response.json();
        const embedding = response_json["data"][0]["embedding"];
        return embedding
    }
    catch (error) {
        console.error(error);
    }
}

// Build prompt and check prompt length
async function build_prompt(query: string, context_chunks: string[]): Promise<string> {
    const prompt_start = "You are a helpful assistant.\\n\\n---\\n\\n Answer: Context:";

    const prompt_end = `\\n\\nQuestion:${query}\\nAnswer:`;   
    
    let prompt = "";
    // Append contexts until hitting limit
    for (let i = 1; i <= context_chunks.length; i++) {
        const joined_chunks = context_chunks.slice(0, i).join("\n\n---\n\n");
        if (joined_chunks.length >= PROMPT_LIMIT) {
            prompt = prompt + "\n\n---\n\n" + context_chunks.slice(0, i - 1).join("\n\n---\n\n");
            break;
        } else if (i === context_chunks.length) {
            prompt = prompt + "\n\n---\n\n" + joined_chunks;
        }
    }
    return prompt;
}

async function construct_messages_list(message_history:any, prompt: string) {
    // Construct a list of messages with a chunk of text
    let messages = [{"role": "system", "content": "You are a helpful assistant."}];
    
    // Populate the messages array with the current chat history
    for (const message of message_history) {
        if (message['isBot']) {
            messages.push({"role": "system", "content": message["text"]});
        } else {
            messages.push({"role": "user", "content": message["text"]});
        }
    }

    // Replace last message with the full prompt
    messages[messages.length - 1]["content"] = prompt;    
    
    return messages;
}
async function construct_llm_payload(prompt: string, context_chunks: string[], chunk: string) {
    // Construct a prompt with a chunk of text
    const prompt_length = prompt.length + chunk.length;
    if (prompt_length > PROMPT_LIMIT) {
        return prompt;
    }
    return prompt + chunk;
}
