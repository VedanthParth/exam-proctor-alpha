import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // Store files in the uploads directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename while preserving original extension
    const uniqueSuffix = uuidv4();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    // Use format: originalname_uniqueId.extension
    cb(null, `${nameWithoutExt}_${uniqueSuffix}${extension}`);
  }
});

// Create Multer upload middleware instance for single file upload
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (adjust as needed)
  },
  fileFilter: function (req, file, cb) {
    // Optional: Add file type validation for video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(null, false); // Reject file without error
    }
  }
});

// Export the upload middleware for single file with field name 'videoBlob'
export const uploadVideoBlob = upload.single('videoBlob');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// POST endpoint for file upload using Multer middleware
app.post('/api/upload-recording', uploadVideoBlob, (req: express.Request, res: express.Response): void => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
      return;
    }

    // Log uploaded file details
    console.log('File uploaded successfully:');
    console.log('- Filename:', req.file.filename);
    console.log('- Path:', req.file.path);
    console.log('- Original name:', req.file.originalname);
    console.log('- Size:', req.file.size, 'bytes');
    console.log('- MIME type:', req.file.mimetype);

    // Send success response with file details
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during file upload'
    });
  }
});

// POST endpoint for transcription (POC simulation)
app.post('/api/transcribe', (req: Request, res: Response) => {
  try {
    const { fileName } = req.body;

    // Validate that fileName is provided
    if (!fileName) {
      res.status(400).json({
        success: false,
        error: 'fileName is required in request body'
      });
      return;
    }

    // Log transcription request
    console.log('Transcription requested for file:', fileName);

    // Simulate transcription delay (optional - remove in production)
    // In a real application, this is where you'd integrate with a Speech-to-Text API
    // such as OpenAI Whisper, Google Speech-to-Text, Azure Speech, etc.
    
    // Generate simulated transcript
    const simulatedTranscript = `This is a simulated transcript for ${fileName}. The audio contained speech that would be processed by a real Speech-to-Text service. This is placeholder text for proof of concept purposes.`;

    // Send success response with simulated transcript
    res.json({
      success: true,
      message: 'Transcription completed successfully',
      fileName: fileName,
      transcript: simulatedTranscript,
      confidence: 0.95, // Simulated confidence score
      processingTime: '2.3s' // Simulated processing time
    });

  } catch (error) {
    console.error('Error during transcription:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during transcription'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload endpoint available at: http://localhost:${PORT}/api/upload-recording`);
  console.log(`Transcribe endpoint available at: http://localhost:${PORT}/api/transcribe`);
});

// Export app for testing purposes
export default app;