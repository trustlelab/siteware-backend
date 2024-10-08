import { Router } from 'express';
import {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  removeAgent
} from '../controllers/agentController'; // Adjust the path as necessary

// Create a new Router instance
const router = Router();

/**
 * @swagger
 * /agent/create:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Smart Agent
 *               model:
 *                 type: string
 *                 example: Model-X
 *               speechRecognition:
 *                 type: boolean
 *                 example: true
 *               languageSupport:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [en, es, fr]
 *               ttsEngine:
 *                 type: string
 *                 example: ElevenLabs
 *               ttsVoices:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [female, male]
 *               sttEngine:
 *                 type: string
 *                 example: Deepgram
 *               realTimeSTT:
 *                 type: boolean
 *                 example: true
 *               voiceCallSupported:
 *                 type: boolean
 *                 example: true
 *               voiceCallProvider:
 *                 type: string
 *                 example: Twilio
 *     responses:
 *       201:
 *         description: Agent created successfully
 *       400:
 *         description: Failed to create agent
 */
router.post('/create', createAgent);

/**
 * @swagger
 * /agent/getlist:
 *   get:
 *     summary: Get list of all agents
 *     tags: [Agent]
 *     responses:
 *       200:
 *         description: List of agents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   model:
 *                     type: string
 *                   speechRecognition:
 *                     type: boolean
 *                   languageSupport:
 *                     type: array
 *                     items:
 *                       type: string
 *                   ttsEngine:
 *                     type: string
 *                   ttsVoices:
 *                     type: array
 *                     items:
 *                       type: string
 *                   sttEngine:
 *                     type: string
 *                   realTimeSTT:
 *                     type: boolean
 *                   voiceCallSupported:
 *                     type: boolean
 *                   voiceCallProvider:
 *                     type: string
 *       500:
 *         description: Failed to fetch agents
 */
router.get('/getlist', getAllAgents);

/**
 * @swagger
 * /agent/get/{id}:
 *   get:
 *     summary: Get agent by ID
 *     tags: [Agent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the agent to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: Agent fetched successfully
 *                 agent:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     model:
 *                       type: string
 *                     speechRecognition:
 *                       type: boolean
 *                     languageSupport:
 *                       type: array
 *                       items:
 *                         type: string
 *                     ttsEngine:
 *                       type: string
 *                     ttsVoices:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sttEngine:
 *                       type: string
 *                     realTimeSTT:
 *                       type: boolean
 *                     voiceCallSupported:
 *                       type: boolean
 *                     voiceCallProvider:
 *                       type: string
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Failed to fetch agent
 */
router.get('/get/:id', getAgentById);

/**
 * @swagger
 * /agent/update/{id}:
 *   put:
 *     summary: Update an existing agent
 *     tags: [Agent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the agent to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Agent Name
 *               model:
 *                 type: string
 *                 example: Updated Model-X
 *               speechRecognition:
 *                 type: boolean
 *               languageSupport:
 *                 type: array
 *                 items:
 *                   type: string
 *               ttsEngine:
 *                 type: string
 *               ttsVoices:
 *                 type: array
 *                 items:
 *                   type: string
 *               sttEngine:
 *                 type: string
 *               realTimeSTT:
 *                 type: boolean
 *               voiceCallSupported:
 *                 type: boolean
 *               voiceCallProvider:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent updated successfully
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Failed to update agent
 */
router.put('/update/:id', updateAgent);

/**
 * @swagger
 * /agent/remove/{id}:
 *   delete:
 *     summary: Remove an agent
 *     tags: [Agent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the agent to remove
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent removed successfully
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Failed to remove agent
 */
router.delete('/remove/:id', removeAgent);

export default router;
