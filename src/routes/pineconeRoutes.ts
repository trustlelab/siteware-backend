import { Router } from 'express';
import {
  createVectorIndex,
  deleteVectorIndex,
  addDocumentsToVectorIndex

} from '../controllers/pineconeController';

const router = Router();

router.post('/create_index',createVectorIndex);
router.post('/delete_index',deleteVectorIndex);

router.get('/test',addDocumentsToVectorIndex);

export default router;

