// mediaStreamModule.ts
import WebSocket from "ws";
import { PrismaClient } from "@prisma/client";
import { setupDeepgram, setupDeepgramWebsocket } from "./Deepgram";
import twilio from "twilio";

const prisma = new PrismaClient();
const accountSid: string = process.env.TWILIO_ACCOUNT_SID || "";
const authToken: string = process.env.TWILIO_AUTH_TOKEN || "";

class MediaStream {
  private connection: WebSocket;
  private deepgram: any;
  private deepgramTTSWebsocket: WebSocket;
  private messages: never[] = [];
  private repeatCount: number = 0;
  private AgentObject: any[] = []; // Array to store agent objects
  private streamSid: string = "";

  constructor(ws: WebSocket) {
    this.connection = ws;
    this.initConnection();
    this.deepgram = setupDeepgram(this);
    this.deepgramTTSWebsocket = setupDeepgramWebsocket(this);
  }

  private initConnection() {
    this.connection.on("open", () => {
      console.log("WebSocket connection opened.");
    });

    this.connection.on("message", this.processData.bind(this));
  }

  private async processData(data: string) {
    const DataObject = JSON.parse(data);
    const event = DataObject.event;

    switch (event) {
      case "start":
        this.handleStartEvent(DataObject);
        break;
      case "media":
        if (DataObject.media.track === "inbound") {
          const rawAudio = Buffer.from(DataObject.media.payload, "base64");
          this.deepgram.send(rawAudio);
        }
        break;
      case "stop":
        this.handleClose();
        break;
      case "mark":
        console.log("twilio: Mark event received", data);
        break;
    }
  }

  private async handleStartEvent(DataObject: any) {
    console.log("Call accepted");
    this.streamSid = DataObject.streamSid;

    const client = twilio(accountSid, authToken);
    client
      .calls(DataObject.start.callSid)
      .fetch()
      .then(async (call) => {
        const agent = await prisma.agent.findFirst({
          where: { phoneNumber: call.to },
        });

        if (agent) {
          this.AgentObject.push(agent);
        }

        console.log(this.getAgentObject()[0].welcomeMessage);
        this.promptLLM(this.getAgentObject()[0].welcomeMessage);
      })
      .catch((error) => console.error(`Error fetching call details: ${error.message}`));
  }

  private handleClose() {
    console.log("The call is closed");
  }

  getAgentObject() {
    return this.AgentObject;
  }

  public sendData(messageJSON: string) {
    if (this.connection.readyState === WebSocket.OPEN) {
      try {
        this.connection.send(messageJSON);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      console.error("WebSocket connection is not open. Cannot send message.");
    }
  }

  private async promptLLM(prompt: string) {
    // OpenAI GPT prompt logic here
  }
}

export { MediaStream };
