import { Router } from 'express';
import multer from 'multer';
import { recordingController } from '../controllers/recording';

const router: Router = Router();

// Configure multer for recording uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video and audio files
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Upload a recording
router.post('/upload', upload.single('recording'), recordingController.uploadRecording);

// Get a recording
router.get('/:sessionId/:recordingType', recordingController.getRecording);

// Get recording information
router.get('/:sessionId/info', recordingController.getRecordingInfo);

// Delete a recording
router.delete('/:sessionId/:recordingType', recordingController.deleteRecording);

export default router;
