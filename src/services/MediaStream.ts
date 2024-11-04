// mediaStreamModule.ts
import WebSocket from "ws";
import { PrismaClient } from "@prisma/client";
import { setupDeepgram, setupDeepgramWebsocket } from "./Deepgram";
import twilio from "twilio";
import promptLLM from './LLM'

const prisma = new PrismaClient();
const accountSid: string = process.env.TWILIO_ACCOUNT_SID || "";
const authToken: string = process.env.TWILIO_AUTH_TOKEN || "";

class MediaStream {
  private connection: WebSocket;
  deepgram: any;
  deepgramTTSWebsocket: WebSocket;
  messages: never[] = [];
  repeatCount: number = 0;
  private AgentObject: any[] = []; // Array to store agent objects

  public streamSid: string = "";
  public speaking = false;
  
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
        // console.log(this.getAgentObject()[0].agentId);

        // promptLLM(this, this.getAgentObject()[0].welcomeMessage);

        // Send the welcome message, agent id and call details to the LLM
        promptLLM(this, this.getAgentObject()[0].welcomeMessage);
      })
      .catch((error) => console.error(`Error fetching call details: ${error.message}`));
  }

  private handleClose() {
    console.log("The call is closed");
  }

  getAgentObject() {
    return this.AgentObject;
  }

  sendData(messageJSON: string) {

    // Check if the WebSocket connection is open
    if (this.connection.readyState === WebSocket.OPEN) {
        try {
            console.log("WebSocket connection is open. Sending message..."); // Confirm connection status
            this.connection.send(messageJSON);
            console.log("Message sent successfully"); // Confirm successful send
        } catch (error) {
            console.error("Error sending message:", error); // Log specific send errors
        }
    } else {
        console.error("WebSocket connection is not open. Cannot send message.");
        console.log("WebSocket readyState:", this.connection.readyState); // Log current WebSocket state
    }
}

}

export default MediaStream;
