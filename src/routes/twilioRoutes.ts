import { Router } from 'express';
import {
  addTwilioNumber,
  removeTwilioNumber,
  listTwilioNumbers,
  setupTwilioWebhook,
  validateTwilioNumber,
  updateTwilioNumberLabel,
} from '../controllers/twilioController';

const router = Router();

/**
 * @swagger
 * /twilio/add-number:
 *   post:
 *     summary: Add a new Twilio number
 *     tags: [Twilio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               label:
 *                 type: string
 *                 example: "Customer Support Line"
 *               accountSid:
 *                 type: string
 *                 example: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
 *               authToken:
 *                 type: string
 *                 example: "your_auth_token"
 *     responses:
 *       201:
 *         description: Twilio number added successfully
 *       400:
 *         description: Failed to add Twilio number
 *       401:
 *         description: Authorization taoken is required
 *       500:
 *         description: Internal server error
 */
router.post('/add-number', addTwilioNumber);

/**
 * @swagger
 * /twilio/remove-number/{id}:
 *   delete:
 *     summary: Remove an existing Twilio number
 *     tags: [Twilio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Twilio number to remove
 *     responses:
 *       200:
 *         description: Twilio number removed successfully
 *       400:
 *         description: Invalid or missing Twilio number ID
 *       401:
 *         description: Authorization token is required
 *       500:
 *         description: Internal server error
 */
router.delete('/remove-number/:id', removeTwilioNumber);

/**
 * @swagger
 * /twilio/list-numbers:
 *   get:
 *     summary: List all Twilio numbers
 *     tags: [Twilio]
 *     responses:
 *       200:
 *         description: List of Twilio numbers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   phoneNumber:
 *                     type: string
 *                     example: "+1234567890"
 *                   label:
 *                     type: string
 *                     example: "Customer Support Line"
 *       401:
 *         description: Authorization token is required
 *       500:
 *         description: Internal server error
 */
router.get('/list-numbers', listTwilioNumbers);

/**
 * @swagger
 * /twilio/setup-webhook:
 *   post:
 *     summary: Set up a webhook for a Twilio number
 *     tags: [Twilio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               label:
 *                 type: string
 *                 example: "Customer Support Line"
 *               webhookUrl:
 *                 type: string
 *                 example: "https://example.com/webhook"
 *     responses:
 *       200:
 *         description: Webhook set up successfully
 *       400:
 *         description: Phone number or webhook URL is required or failed to set up webhook
 *       401:
 *         description: Authorization token is required
 *       404:
 *         description: Twilio number not found
 *       500:
 *         description: Internal server error
 */
router.post('/setup-webhook', setupTwilioWebhook);

/**
 * @swagger
 * /twilio/validate-number:
 *   post:
 *     summary: Validate a Twilio number
 *     tags: [Twilio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               label:
 *                 type: string
 *                 example: "Customer Support Line"
 *     responses:
 *       200:
 *         description: Twilio number is valid
 *       400:
 *         description: Phone number is required or Twilio number is not valid
 *       401:
 *         description: Authorization token is required
 *       500:
 *         description: Internal server error
 */
router.post('/validate-number', validateTwilioNumber);

/**
 * @swagger
 * /twilio/update-number/{id}:
 *   put:
 *     summary: Update label for an existing Twilio number
 *     tags: [Twilio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Twilio number to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 example: "Updated Support Line"
 *     responses:
 *       200:
 *         description: Twilio number label updated successfully
 *       400:
 *         description: Invalid or missing Twilio number ID
 *       401:
 *         description: Authorization token is required
 *       500:
 *         description: Internal server error
 */
router.put('/update-number/:id', updateTwilioNumberLabel);

export default router;