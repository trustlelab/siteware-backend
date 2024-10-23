import { Router, Request, Response } from "express";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";

import {
  addTwilioNumber,
  removeTwilioNumber,
  listTwilioNumbers,
  setupTwilioWebhook,
  validateTwilioNumber,
  updateTwilioNumberLabel,
} from '../controllers/twilioController';

const router = Router();

router.post('/add-number', addTwilioNumber);
router.delete('/remove-number/:id', removeTwilioNumber);
router.get('/list-numbers', listTwilioNumbers);
router.post('/setup-webhook', setupTwilioWebhook);
router.post('/validate-number', validateTwilioNumber);
router.put('/update-number/:id', updateTwilioNumberLabel);



// TwiML route for handling voice webhooks
router.post("/twiml", (req: Request, res: Response) => {
  const responseXml = `
  <?xml version="1.0" encoding="UTF-8" ?>
  <Response>
    <Say>Speak now.</Say>
    <Connect>
      <Stream url="wss://beta.trustle.one/streams">
        <Parameter name="aCustomParameter" value="aCustomValue that was set in TwiML" />
      </Stream>
    </Connect>
    <Say>Goodbye.</Say>
  </Response>`;
  
  res.writeHead(200, {
    "Content-Type": "text/xml",
    "Content-Length": Buffer.byteLength(responseXml),
  });
  res.end(responseXml);
});

// Messaging webhook
router.post("/message", (req: Request, res: Response) => {
  const twiml = new MessagingResponse();
  const messageBody = req.body.Body;

  twiml.message(`You said: ${messageBody}`);

  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});

// Call status callback
router.post("/status-callback", (req: Request, res: Response) => {
  const { CallSid, CallStatus } = req.body;
  const eventMessage = `Call ${CallSid} has status: ${CallStatus}`;
  console.log(eventMessage);
  res.status(200).send("Status callback received");
});

export default router;
