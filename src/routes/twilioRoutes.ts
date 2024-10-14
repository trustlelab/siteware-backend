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

router.post('/add-number', addTwilioNumber);
router.delete('/remove-number/:id', removeTwilioNumber);
router.get('/list-numbers', listTwilioNumbers);
router.post('/setup-webhook', setupTwilioWebhook);
router.post('/validate-number', validateTwilioNumber);
router.put('/update-number/:id', updateTwilioNumberLabel);

export default router;
