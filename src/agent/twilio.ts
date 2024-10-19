import dotenv from 'dotenv';
import twilio, { Twilio } from 'twilio';
dotenv.config();

// Twilio credentials and setup
const accountSid: string = process.env.TWILIO_ACCOUNT_SID || '';
const authToken: string = process.env.TWILIO_AUTH_TOKEN || '';
const twilioPhoneNumber: string = process.env.TWILIO_PHONE_NUMBER || '';
const client: Twilio = twilio(accountSid, authToken);

const url: string = process.env.BASE_URL; // Ngrok/Forwarding URL

// Function to initiate ngrok and set Twilio webhook
export async function initiateTwilio(broadcastLog: (message: string) => void) {
  try {
    // Set Twilio webhook URL
    const webhookUrl: string = `${url}/twiml`;

    // Fetch Twilio phone numbers and update webhook URLs
    const incomingPhoneNumbers = await client.incomingPhoneNumbers
      .list({ phoneNumber: twilioPhoneNumber });

    incomingPhoneNumbers.forEach((number) => {
      client.incomingPhoneNumbers(number.sid).update({
        smsUrl: webhookUrl,
        voiceUrl: webhookUrl
      });
      const logMessage = `Twilio webhook URL updated for ${twilioPhoneNumber}: ${webhookUrl}`;
      console.log(logMessage);
      broadcastLog(logMessage); // Broadcast log to connected clients
    });
  } catch (error) {
    const errorMessage = `Error setting up ngrok and Twilio webhook: ${error}`;
    console.error(errorMessage);
    broadcastLog(errorMessage); // Broadcast error log to clients
  }
}
