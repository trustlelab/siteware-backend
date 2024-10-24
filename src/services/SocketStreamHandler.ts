// socketStreamHandler.ts
import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import { MediaStream } from "./MediaStream"; // Import the mediaStreamModule class

class SocketStreamHandler {
  private wss: WebSocketServer;

  constructor(httpServer: Server) {
    // Initialize WebSocketServer with the provided HTTP server
    this.wss = new WebSocketServer({ server: httpServer });
    this.initWebSocket();
  }

  private initWebSocket() {
    // Handle connection to the WebSocket server
    this.wss.on("connection", (ws: WebSocket) => {
      // Use MediaStream to handle the WebSocket connection
      const clientConnection = new MediaStream(ws);
    });
  }

  public broadcast(message: string) {
    // Send a message to all connected WebSocket clients
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export default SocketStreamHandler;
