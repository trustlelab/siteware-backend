import { Router } from 'express';
import {
  handleIncomingMessage,
} from '../controllers/chatController';

const router = Router();

router.post('/message', handleIncomingMessage);


export default router;
