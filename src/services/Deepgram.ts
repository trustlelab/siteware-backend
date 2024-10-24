// deepgramHandlers.ts
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import WebSocketClient from "ws";

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);

const setupDeepgram = (mediaStream: any) => {
  // Logic for setting up Deepgram and handling transcription events
  const deepgram = deepgramClient.listen.live({
    model: "nova-2-phonecall",
    language: "en",
    encoding: "mulaw",
    sample_rate: 8000,
    channels: 1,
    interim_results: true,
    endpointing: 300,
    utterance_end_ms: 1000,
  });

  deepgram.addListener(LiveTranscriptionEvents.Open, () => {
    console.log("Deepgram STT: Connected");
  });

  deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel.alternatives[0].transcript;
    if (transcript) {
      console.log(`Deepgram STT: ${transcript}`);
      mediaStream.sendData(JSON.stringify({ event: "transcript", transcript }));
    }
  });

  deepgram.addListener(LiveTranscriptionEvents.Close, () => {
    console.log("Deepgram STT: Disconnected");
  });

  return deepgram;
};

const setupDeepgramWebsocket = (mediaStream: any) => {
  const ws = new WebSocketClient("wss://api.deepgram.com/v1/speak", {
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
    },
  });

  ws.on("open", () => {
    console.log("Deepgram TTS: Connected");
  });

  ws.on("message", (data) => {
    console.log(`Deepgram TTS: ${data}`);
    mediaStream.sendData(data);
  });

  return ws;
};

export { setupDeepgram, setupDeepgramWebsocket };
