import { Router } from 'express';
import multer from 'multer';
import {
  uploadFile,
  listUserFiles,
  deleteUserFile
} from '../controllers/fileController';

const router = Router();

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/files/'); // Directory to store uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.pdf`); // Save only PDF files
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(null, false); // Reject the file
    }
    cb(null, true); // Accept the file
  }
});

// Routes
router.post('/upload', upload.single('file'), uploadFile);
router.get('/list', listUserFiles);
router.delete('/delete/:id', deleteUserFile);

export default router;
