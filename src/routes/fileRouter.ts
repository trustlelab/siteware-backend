import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  uploadFile,
  listUserFiles,
  deleteUserFile
} from '../controllers/fileController';

const router = Router();

const uploadDir = path.join(__dirname, '..','..', 'uploads', 'files');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.pdf`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(null, false);
    }
    cb(null, true);
  }
});

router.post('/upload', upload.single('file'), uploadFile);
router.get('/list', listUserFiles);
router.delete('/delete/:id', deleteUserFile);

export default router;
