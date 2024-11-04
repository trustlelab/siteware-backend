import dotenv from "dotenv";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import path from "path";
import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import authRoutes from "./routes/authRoutes";
import agentRoutes from "./routes/agentRoutes";
import twilioRoutes from "./routes/twilioRoutes";
import voiceLabRoutes from "./routes/voiceLabRoutes";
import pineconeRoutes from "./routes/pineconeRoutes";

import fileRoutes from "./routes/fileRouter";
import { loadSwaggerDocs } from "./swaggerLoader";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";


import MediaStream from './services/MediaStream'
import chatRoutes from "./routes/chatRoutes";

// Initialize dotenv for environment variables
dotenv.config();


// Express app setup
const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 8000;
const WEBHOOK_HOST = process.env.WEBHOOK_HOST || "https://localhost:8000";

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

app.use("/chat", chatRoutes);
app.use("/pinecone", pineconeRoutes);

// WebSocket setup for real-time logs
const httpServer: Server = app.listen(PORT, () => {
  console.log(`Server running on ${WEBHOOK_HOST}`);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws: WebSocket) => {
  // Instead of handling the connection directly, pass it to the class
  const clientConnection = new MediaStream(ws);
});


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
    <Stream url="wss://${WEBHOOK_HOST}/streams">
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
  console.log(eventMessage);

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
