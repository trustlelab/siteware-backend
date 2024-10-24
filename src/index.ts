import dotenv from "dotenv";
import twilio, { Twilio } from "twilio";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import path from "path";
import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import authRoutes from "./routes/authRoutes";
import agentRoutes from "./routes/AgentRoutes";
import twilioRoutes from "./routes/twilioRoutes";
import voiceLabRoutes from "./routes/voiceLabRoutes";
import fileRoutes from "./routes/fileRouter";
import { loadSwaggerDocs } from "./swaggerLoader";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";
import OpenAI from "openai";
const openai = new OpenAI();
import WebSocketClient from "ws"; // Rename to WebSocketClient to avoid confusion
import { PrismaClient } from "@prisma/client"; // Import Prisma Client

import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);

// Initialize dotenv for environment variables
dotenv.config();

// Twilio credentials and setup
const accountSid: string = process.env.TWILIO_ACCOUNT_SID || "";
const authToken: string = process.env.TWILIO_AUTH_TOKEN || "";

// Express app setup
const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 8000;

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger documentation setup
const swaggerDocs = loadSwaggerDocs(path.join(__dirname, "../docs"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Define your routes
app.use("/auth", authRoutes);
app.use("/agent", agentRoutes);
app.use("/twilio", twilioRoutes);
app.use("/voice", voiceLabRoutes);
app.use("/file/", fileRoutes);

// WebSocket setup for real-time logs
const httpServer: Server = app.listen(PORT, () => {
  console.log(`Server running on https://beta.trustle.one`);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws: WebSocket) => {
  // Instead of handling the connection directly, pass it to the class
  const clientConnection = new MediaStream(ws);
});





const prisma = new PrismaClient(); // Initialize Prisma Client

let streamSid: string = "";


class MediaStream {
  private connection: WebSocket;
  deepgram: any;
  deepgramTTSWebsocket: WebSocket;
  messages: never[] = [];
  repeatCount: number = 0;
  private AgentObject: any[] = []; // Array to store agent objects

  constructor(ws: WebSocket) {
    this.connection = ws;

    // Ensure connection is properly initialized and ready to send messages
    this.connection.on("open", () => {
      console.log("WebSocket connection opened.");

    });

    this.connection.on("message", this.processData.bind(this));

    this.deepgram = setupDeepgram(this);
    this.deepgramTTSWebsocket = setupDeepgramWebsocket(this);
  }



  

  processData = async (data: string) => {
 


    const DataObject = JSON.parse(data);
    const event = DataObject.event;

    if (event === "start") {
      log("Call accepted");
      streamSid = DataObject.streamSid;

      const client = twilio(accountSid, authToken);
      client
        .calls(DataObject.start.callSid)
        .fetch()
        .then(async (call) => {
          console.log(`To: ${call.to}`);

          const agent = await prisma.agent.findFirst({
            where: { phoneNumber: call.to },
          });

          if (agent) {
            this.AgentObject.push(agent); // Push the agent object to the array
          }


          console.log(this.getAgentObject()[0].welcomeMessage)
          promptLLM(this,this.getAgentObject()[0].welcomeMessage)
        })
        .catch((error) =>
          console.error(`Error fetching call details: ${error.message}`)
        );
    }

    if (event === "media" && DataObject.media.track === "inbound") {
      const rawAudio = Buffer.from(DataObject.media.payload, "base64");
      this.deepgram.send(rawAudio);
    }

    if (event === "stop") {
      this.handleClose();
    }

    if (event === "mark") {
      console.log("twilio: Mark event received", data);
    }
  };

  private handleClose() {
    log("The call is closed");
  }

  getAgentObject() {
    return this.AgentObject;
  }

  sendData(messageJSON: string) {
    // Check if the connection is open before sending
    if (this.connection.readyState === WebSocket.OPEN) {
      try {
        this.connection.send(messageJSON);
        // console.log("Message sent successfully");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      console.error("WebSocket connection is not open. Cannot send message.");
    }
  }
}

let llmStart = 0;
let ttsStart = 0;
let firstByte = true;
let speaking = false;
let send_first_sentence_input_time: number | null = null;
const chars_to_check = [".", ",", "!", "?", ";", ":"];
let keepAlive: any;

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
            log(`deepgram STT: [Speech Final] ${utterance}`);
            llmStart = Date.now();
            promptLLM(mediaStream, utterance); // Send the final transcript to OpenAI for response
          } else {
            log(`deepgram STT:  [Is Final] ${transcript}`);
          }
        } else {
          log(`deepgram STT:    [Interim Result] ${transcript}`);
          if (speaking) {
            console.log("twilio: clear audio playback", streamSid);
            // Handles Barge In
            const messageJSON = JSON.stringify({
              event: "clear",
              streamSid: streamSid,
            });
            mediaStream.sendData(messageJSON);

            mediaStream.deepgramTTSWebsocket.send(
              JSON.stringify({ type: "Clear" })
            );
            speaking = false;
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
      log("deepgram STT: disconnected");
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

  speaking = true;
  let firstToken = true;
  for await (const chunk of stream) {
    if (speaking) {
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

const deepgramTTSWebsocketURL =
  "wss://api.deepgram.com/v1/speak?encoding=mulaw&sample_rate=8000&container=none&model=aura-orpheus-en";

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
    // Handles barge in
    if (speaking) {
      try {
        let json = JSON.parse(data.toString());
        console.log("deepgram TTS: ", data.toString());
        return;
      } catch (e) {
        // Ignore
      }
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
            `>>> deepgram TTS: Time to First Byte from end of sentence token = `,
            end - send_first_sentence_input_time
          );
        }
      }
      const payload = data.toString("base64");

      const messageJSON = JSON.stringify({
        event: "media",
        streamSid,
        media: { payload },
      });
      mediaStream.sendData(messageJSON);
    }
  });

  ws.on("close", function close() {
    console.log("deepgram TTS: Disconnected from the WebSocket server");
  });

  ws.on("error", function error(error) {
    console.log("deepgram TTS: error received");
    console.error(error);
  });
  return ws;
};

// Function to broadcast logs to WebSocket clients
function log(message: string) {
  wss.clients.forEach(
    (client: { readyState: any; OPEN: any; send: (arg0: string) => void }) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  );
}

// Set a timeout to call the function from the separate file

// Welcome route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to the Siteware API! 1.0.0" });
});

// Serve files via a download route
app.get("/download/:fileName", (req: Request, res: Response) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "../uploads/files/", fileName);

  res.download(filePath, (err) => {
    if (err) {
      res.status(404).json({ message: "File not found" });
    }
  });
});

// **New TwiML route for handling voice webhooks**
app.post("/twiml", async (req: Request, res: Response) => {
  
  // Assume agent data could be fetched here
  const responseXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Response>
  <Connect>
    <Stream url="wss://beta.trustle.one/streams">
      <Parameter name="aCustomParameter" value="defaultParam" />
    </Stream>
  </Connect>
</Response>`;

  res.writeHead(200, {
    "Content-Type": "text/xml",
    "Content-Length": Buffer.byteLength(responseXml),
  });

  res.end(responseXml);
});

// **Status callback route for call events**
app.post("/status-callback", (req: Request, res: Response) => {
  const { CallSid, CallStatus } = req.body;
  const eventMessage = `Call ${CallSid} has status: ${CallStatus}`;

  console.log(eventMessage);

  // Broadcast the event to WebSocket clients
  log(eventMessage);

  res.status(200).send("Status callback received");
});

// **New route for handling messaging webhooks**
app.post("/message", (req: Request, res: Response) => {
  const twiml = new MessagingResponse();
  const messageBody = req.body.Body;

  // Create an automatic response for messages received
  twiml.message(`You said: ${messageBody}`);

  // Respond with the TwiML
  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});
