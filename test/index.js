import Fastify from 'fastify'
import WebSocket from 'ws'
import fs from 'fs'
import dotenv from 'dotenv'
import fastifyFormBody from '@fastify/formbody'
import fastifyWs from '@fastify/websocket'

import ngrok from 'ngrok'
import twilio from 'twilio'

let streamUrl

async function initiateNgrokTwilio () {
  try {
    // Start ngrok and set the forwarding URL
    const url = await ngrok.connect(5050) // Replace 8080 with your server port
    console.log(`ngrok tunnel established at: ${url}`)
    streamUrl = url.replace(/^https?:\/\//, '') // Set the ngrok URL globally without https://
    // Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID // Twilio Account SID from environment
    const authToken = process.env.TWILIO_AUTH_TOKEN // Twilio Auth Token from environment
    const client = twilio(accountSid, authToken)

    // Your Twilio phone number
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    // Set Twilio webhook URL
    const webhookUrl = `${url}/incoming-call` // The TwiML URL for handling calls or messages
    await client.incomingPhoneNumbers
      .list({ phoneNumber: twilioPhoneNumber })
      .then(incomingPhoneNumbers => {
        incomingPhoneNumbers.forEach(number => {
          client
            .incomingPhoneNumbers(number.sid)
            .update({ smsUrl: webhookUrl, voiceUrl: webhookUrl })
          console.log(
            `Twilio webhook URL updated for ${twilioPhoneNumber}: ${webhookUrl}`
          )
        })
      })
  } catch (error) {
    console.error('Error setting up ngrok and Twilio webhook:', error)
  }
}

// Call the function to initiate ngrok and set up Twilio webhook
initiateNgrokTwilio()

// Load environment variables from .env file
dotenv.config()
// Retrieve the OpenAI API key from environment variables. You must have OpenAI Realtime API access.
const { OPENAI_API_KEY } = process.env
if (!OPENAI_API_KEY) {
  console.error('Missing OpenAI API key. Please set it in the .env file.')
  process.exit(1)
}
// Initialize Fastify
const fastify = Fastify()
fastify.register(fastifyFormBody)
fastify.register(fastifyWs)

// Constants
const SYSTEM_MESSAGE = 'You are a help assitant your name is yawmik'
const VOICE = 'echo'
const PORT = process.env.PORT || 5050 // Allow dynamic port assignment
// List of Event Types to log to the console. See OpenAI Realtime API Documentation. (session.updated is handled separately.)
const LOG_EVENT_TYPES = [
  'response.content.done',
  'rate_limits.updated',
  'response.done',
  'input_audio_buffer.committed',
  'input_audio_buffer.speech_stopped',
  'input_audio_buffer.speech_started',
  'session.created'
]

// Root Route
fastify.get('/', async (request, reply) => {
  reply.send({ message: 'Twilio Media Stream Server is running!' })
})
// Route for Twilio to handle incoming and outgoing calls
// <Say> punctuation to improve text-to-speech translation
fastify.all('/incoming-call', async (request, reply) => {
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                          <Response>
                              <Connect>
                                  <Stream url="wss://${request.headers.host}/media-stream" />
                              </Connect>
                          </Response>`
  reply.type('text/xml').send(twimlResponse)
})

// WebSocket route for media-stream
fastify.register(async fastify => {
  fastify.get('/media-stream', { websocket: true }, (connection, req) => {
    console.log('Client connected')
    const openAiWs = new WebSocket(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      }
    )
    let streamSid = null
    const sendSessionUpdate = () => {
      const sessionUpdate = {
        type: 'session.update',
        session: {
          turn_detection: { type: 'server_vad' },
          input_audio_format: 'g711_ulaw',
          output_audio_format: 'g711_ulaw',
          voice: VOICE,
          instructions: SYSTEM_MESSAGE,
          modalities: ['text', 'audio'],
          temperature: 0.8
        }
      }
      console.log('Sending session update:', JSON.stringify(sessionUpdate))
      openAiWs.send(JSON.stringify(sessionUpdate))
    }
    // Open event for OpenAI WebSocket
    openAiWs.on('open', () => {
      console.log('Connected to the OpenAI Realtime API')
      setTimeout(sendSessionUpdate, 250) // Ensure connection stability, send after .25 seconds
    })
    // Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
    openAiWs.on('message', data => {
      try {
        const response = JSON.parse(data)
        if (LOG_EVENT_TYPES.includes(response.type)) {
          console.log(`Received event: ${response.type}`, response)
        }
        if (response.type === 'session.updated') {
          console.log('Session updated successfully:', response)
        }
        if (response.type === 'response.audio.delta' && response.delta) {
          const audioDelta = {
            event: 'media',
            streamSid: streamSid,
            media: {
              payload: Buffer.from(response.delta, 'base64').toString('base64')
            }
          }
          connection.send(JSON.stringify(audioDelta))
        }
      } catch (error) {
        console.error(
          'Error processing OpenAI message:',
          error,
          'Raw message:',
          data
        )
      }
    })
    // Handle incoming messages from Twilio
    connection.on('message', message => {
      try {
        const data = JSON.parse(message)
        switch (data.event) {
          case 'media':
            if (openAiWs.readyState === WebSocket.OPEN) {
              const audioAppend = {
                type: 'input_audio_buffer.append',
                audio: data.media.payload
              }
              openAiWs.send(JSON.stringify(audioAppend))
            }
            break
          case 'start':
            streamSid = data.start.streamSid
            console.log('Incoming stream has started', streamSid)
            break
          default:
            console.log('Received non-media event:', data.event)
            break
        }
      } catch (error) {
        console.error('Error parsing message:', error, 'Message:', message)
      }
    })
    // Handle connection close
    connection.on('close', () => {
      if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close()
      console.log('Client disconnected.')
    })
    // Handle WebSocket close and errors
    openAiWs.on('close', () => {
      console.log('Disconnected from the OpenAI Realtime API')
    })
    openAiWs.on('error', error => {
      console.error('Error in the OpenAI WebSocket:', error)
    })
  })
})

fastify.listen({ port: PORT }, err => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server is listening on port http://localhost:${PORT}`)
})
