import { Router } from "express";
import { getVoiceList } from "../controllers/voiceLabController";

const router = Router()

router.get('/getList',getVoiceList)

export default router;