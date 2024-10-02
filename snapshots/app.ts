const WebSocket = require("ws");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

const path = require("path");

require("dotenv").config();

// Google Speech to Text and other configuration code removed for now

wss.on("connection", function connection(ws) {
  console.log("New Connection Initiated");

  ws.on("message", function incoming(message) {
    const msg = JSON.parse(message);
    switch (msg.event) {
      case "connected":
        console.log(`A new call has connected.`);
        break;
      case "start":
        console.log(`Starting Media Stream ${msg.streamSid}`);
        break;
      case "media":
        // Log the media packets to the console
        if (msg.media && msg.media.payload) {
          console.log("Media Packet Received:", msg.media.payload);
        } else {
          console.log("Media event received but no payload");
        }
        break;
      case "stop":
        console.log(`Call Has Ended`);
        break;
    }
  });
  
});

app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/index.html")));

app.post("/", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
   <Response>
  <Start>
    <Stream url="wss://91cf-37-111-223-234.ngrok-free.app" />
  </Start>
  <Say>I will stream the next 60 seconds of audio through your websocket</Say>
  <Pause length="60" />
</Response>

  `);
});

console.log("Listening on Port 8080");
server.listen(8080);
