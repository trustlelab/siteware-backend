// deepgramHandlers.ts
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import WebSocketClient from "ws";
import promptLLM from './LLM'
const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
let llmStart = 0;
let ttsStart = 0;
let firstByte = true;
let send_first_sentence_input_time: number | null = null;
let keepAlive: any;

const deepgramTTSWebsocketURL =
  "wss://api.deepgram.com/v1/speak?encoding=mulaw&sample_rate=8000&container=none&model=aura-orpheus-en";

  
const setupDeepgram = (mediaStream: any) => {
  let is_finals: any[] = [];
  const deepgram = deepgramClient.listen.live({
    // Model
    model: "nova-2-phonecall",
    language: "en",
    // Formatting
    smart_format: true,
    // Audio
    encoding: "mulaw",
    sample_rate: 8000,
    channels: 1,
    multichannel: false,
    // End of Speech
    no_delay: true,
    interim_results: true,
    endpointing: 300,
    utterance_end_ms: 1000,
  });

  if (keepAlive) clearInterval(keepAlive);
  keepAlive = setInterval(() => {
    deepgram.keepAlive(); // Keeps the connection alive
  }, 10 * 1000);

  deepgram.addListener(LiveTranscriptionEvents.Open, async () => {
    console.log("deepgram STT: Connected");

    deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel.alternatives[0].transcript;
      if (transcript !== "") {
        if (data.is_final) {
          is_finals.push(transcript);
          if (data.speech_final) {
            const utterance = is_finals.join(" ");
            is_finals = [];
            console.log(`deepgram STT: [Speech Final] ${utterance}`);
            llmStart = Date.now();
            promptLLM(mediaStream, utterance); // Send the final transcript to OpenAI for response
          } else {
            console.log(`deepgram STT:  [Is Final] ${transcript}`);
          }
        } else {
          console.log(`deepgram STT:    [Interim Result] ${transcript}`);
          if (mediaStream.speaking) {
            console.log("twilio: clear audio playback", mediaStream.streamSid);
            // Handles Barge In
            const messageJSON = JSON.stringify({
              event: "clear",
              streamSid: mediaStream.streamSid,
            });
            mediaStream.sendData(messageJSON);

            mediaStream.deepgramTTSWebsocket.send(
              JSON.stringify({ type: "Clear" })
            );
            mediaStream.speaking = false;
          }
        }
      }
    });

    deepgram.addListener(LiveTranscriptionEvents.UtteranceEnd, (data) => {
      if (is_finals.length > 0) {
        console.log("deepgram STT: [Utterance End]");
        const utterance = is_finals.join(" ");
        is_finals = [];
        console.log(`deepgram STT: [Speech Final] ${utterance}`);
        llmStart = Date.now();
        promptLLM(mediaStream, utterance)
      }
    });

    deepgram.addListener(LiveTranscriptionEvents.Close, async () => {
      console.log("deepgram STT: disconnected");
      clearInterval(keepAlive);
      deepgram.requestClose();
    });

    deepgram.addListener(LiveTranscriptionEvents.Error, async (error) => {
      console.log("deepgram STT: error received");
      console.error(error);
    });

    deepgram.addListener(LiveTranscriptionEvents.Metadata, (data) => {
      // console.log('deepgram STT: metadata received:', data)
    });
  });

  return deepgram;
};


const setupDeepgramWebsocket = (mediaStream: any) => {
  const options = {
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
    },
  };
  const ws = new WebSocketClient(deepgramTTSWebsocketURL, options);

  ws.on("open", function open() {
    console.log("deepgram TTS: Connected");
  });

  ws.on("message", function incoming(data) {

   
 

    if (mediaStream.speaking) {
      try {
        const json = JSON.parse(data.toString());
      } catch (error) {
               // Ignore
      }

      // Process First Byte logic
      if (firstByte) {
        const end = Date.now();
        const duration = end - ttsStart;
        console.warn(
          "\n\n>>> deepgram TTS: Time to First Byte = ",
          duration,
          "\n"
        );
        firstByte = false;

        if (send_first_sentence_input_time) {
          console.log(
            ">>> deepgram TTS: Time to First Byte from end of sentence token = ",
            end - send_first_sentence_input_time
          );
        }
      }

      const payload = data.toString("base64");
      console.log(`SIDc... : ${mediaStream.streamSid}`)
        const messageJSON = JSON.stringify({
          event: "media",
          streamSid: mediaStream.streamSid,  // Corrected line
          media: { payload },
        });
      
        mediaStream.sendData(messageJSON);
    }
  });

  ws.on("close", function close() {
    console.log("deepgram TTS: Disconnected from the WebSocket server");
  });

  ws.on("error", function error(error) {
    console.log("deepgram TTS: Error received");
    console.error(error);
  });

  return ws;
};



export { setupDeepgram, setupDeepgramWebsocket };
