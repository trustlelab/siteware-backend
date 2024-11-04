import OpenAI from "openai";
const openai = new OpenAI();


let llmStart = 0;
let ttsStart = 0;
let firstByte = true;
let send_first_sentence_input_time: number | null = null;
const chars_to_check = [".", ",", "!", "?", ";", ":"];

async function promptLLM(mediaStream: any, prompt: string) {
  const AgentObject = mediaStream.getAgentObject();
  const { agentPrompt } = AgentObject[0];
  console.log(`agentPrompt : ${agentPrompt}`);


  const stream = openai.beta.chat.completions.stream({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: [
      {
        role: "assistant",
        content: agentPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  mediaStream.speaking = true;

  console.log(mediaStream.speaking)
  let firstToken = true;
  for await (const chunk of stream) {
    if (mediaStream.speaking) {
      if (firstToken) {
        const end = Date.now();
        const duration = end - llmStart;
        ttsStart = Date.now();
        console.warn(
          "\n>>> openai LLM: Time to First Token = ",
          duration,
          "\n"
        );
        firstToken = false;
        firstByte = true;
      }
      let chunk_message = chunk.choices[0].delta.content;
      if (chunk_message) {
        process.stdout.write(chunk_message);
        console.log(`GPT response: ${chunk_message}`);
        if (
          !send_first_sentence_input_time &&
          containsAnyChars(chunk_message)
        ) {
          send_first_sentence_input_time = Date.now();
        }
        mediaStream.deepgramTTSWebsocket.send(
          JSON.stringify({ type: "Speak", text: chunk_message })
        );
      }
    }
  }
  // Tell TTS Websocket we're finished generating tokens
  mediaStream.deepgramTTSWebsocket.send(JSON.stringify({ type: "Flush" }));
}

function containsAnyChars(str: string): boolean {
  // Convert the string to an array of characters
  let strArray: string[] = Array.from(str);

  // Check if any character in strArray exists in chars_to_check
  return strArray.some((char: string) => chars_to_check.includes(char));
}

export default promptLLM;
  