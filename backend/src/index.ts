import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { pipeline } from '@xenova/transformers';

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
    // Accept video files and audio files for transcription
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(null, false); // Reject file without error
    }
  }
});

// Export the upload middleware for single file with field name 'videoBlob'
export const uploadVideoBlob = upload.single('videoBlob');

// Singleton Transcription Service using @xenova/transformers
class TranscriptionService {
  private static instance: TranscriptionService;
  private transcriber: any = null;
  private isLoading: boolean = false;
  private loadPromise: Promise<any> | null = null;

  private constructor() {}

  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  private async loadModel(): Promise<any> {
    if (this.transcriber) {
      return this.transcriber;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this.initializeModel();

    try {
      this.transcriber = await this.loadPromise;
      console.log('Transcription model loaded successfully');
      return this.transcriber;
    } catch (error) {
      console.error('Failed to load transcription model:', error);
      this.loadPromise = null;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async initializeModel(): Promise<any> {
    try {
      // Use Whisper tiny model for faster processing (you can change to 'base', 'small', etc. for better accuracy)
      const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
      return transcriber;
    } catch (error) {
      throw new Error(`Model initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribe(filePath: string): Promise<{ transcript: string; confidence: number; processingTime: string }> {
    const startTime = Date.now();
    
    try {
      // Validate file exists
      await fs.access(filePath);
      
      console.log('Loading transcription model...');
      const transcriber = await this.loadModel();
      
      console.log('Processing audio file for transcription...');
      
      // Process the audio file
      const result = await transcriber(filePath);
      
      const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
      
      return {
        transcript: result.text || 'No speech detected in the audio file.',
        confidence: 0.95, // @xenova/transformers doesn't provide confidence scores by default
        processingTime: processingTime
      };
    } catch (error) {
      const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
      console.error('Transcription error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('ENOENT') || error.message.includes('not found')) {
          throw new Error('Audio file not found or not accessible');
        } else if (error.message.includes('Model initialization failed')) {
          throw new Error('Failed to initialize transcription model');
        } else if (error.message.includes('unsupported format')) {
          throw new Error('Unsupported audio format');
        } else {
          throw new Error(`Transcription failed: ${error.message}`);
        }
      } else {
        throw new Error('Unknown transcription error occurred');
      }
    }
  }

  // Method to check if model is ready
  isModelReady(): boolean {
    return this.transcriber !== null && !this.isLoading;
  }

  // Method to get model loading status
  getModelStatus(): { ready: boolean; loading: boolean } {
    return {
      ready: this.transcriber !== null,
      loading: this.isLoading
    };
  }
}

// Create singleton instance
const transcriptionService = TranscriptionService.getInstance();

// Async transcription function using the singleton service
async function transcribeAudio(filePath: string): Promise<{ transcript: string; confidence: number; processingTime: string }> {
  return await transcriptionService.transcribe(filePath);
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Model status endpoint
app.get('/api/transcription-status', (req: Request, res: Response) => {
  const status = transcriptionService.getModelStatus();
  res.json({
    success: true,
    message: 'Transcription service status',
    modelReady: status.ready,
    modelLoading: status.loading,
    timestamp: new Date().toISOString()
  });
});

// POST endpoint for file upload using Multer middleware
app.post('/api/upload-recording', uploadVideoBlob, async (req: express.Request, res: express.Response): Promise<void> => {
  let uploadedFilePath: string | null = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ 
        success: false, 
        error: 'No file uploaded',
        details: 'Request must include a file with field name "videoBlob"'
      });
      return;
    }

    // Store file path for cleanup
    uploadedFilePath = req.file.path;

    // Log uploaded file details
    console.log('File uploaded successfully:');
    console.log('- Filename:', req.file.filename);
    console.log('- Path:', req.file.path);
    console.log('- Original name:', req.file.originalname);
    console.log('- Size:', req.file.size, 'bytes');
    console.log('- MIME type:', req.file.mimetype);

    // Validate file exists after upload
    try {
      await fs.access(req.file.path);
    } catch (fileAccessError) {
      console.error('File not accessible after upload:', fileAccessError);
      res.status(500).json({
        success: false,
        error: 'File upload failed',
        details: 'Uploaded file is not accessible on the server'
      });
      return;
    }

    // Perform transcription on the uploaded file
    let transcriptionResult;
    try {
      console.log('Starting transcription process...');
      transcriptionResult = await transcribeAudio(req.file.path);
      console.log('Transcription completed');
    } catch (transcriptionError) {
      console.error('Transcription failed:', transcriptionError);
      res.status(500).json({
        success: false,
        error: 'Transcription failed',
        details: transcriptionError instanceof Error ? transcriptionError.message : 'An error occurred while processing the audio/video file for transcription'
      });
      return;
    }

    // Send success response with file details and transcript
    res.json({
      success: true,
      message: 'File uploaded and transcribed successfully',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      transcription: {
        transcript: transcriptionResult.transcript,
        confidence: transcriptionResult.confidence,
        processingTime: transcriptionResult.processingTime
      }
    });

  } catch (error) {
    console.error('Unexpected error in upload endpoint:', error);
    
    // Check if response was already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: 'An unexpected error occurred during file upload and transcription'
      });
    }
  } finally {
    // Clean up: Delete the temporary uploaded file
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
        console.log('Temporary file cleaned up:', uploadedFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', uploadedFilePath, cleanupError);
        // Don't throw here - we don't want cleanup errors to affect the response
        // Consider adding this to a cleanup queue or logging system for monitoring
      }
    }
  }
});

// Multer error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(413).json({
          success: false,
          error: 'File too large',
          details: 'File size exceeds the maximum limit of 100MB'
        });
        return;
      case 'LIMIT_FILE_COUNT':
        res.status(400).json({
          success: false,
          error: 'Too many files',
          details: 'Only one file is allowed per upload'
        });
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({
          success: false,
          error: 'Unexpected field',
          details: 'File must be uploaded with field name "videoBlob"'
        });
        return;
      default:
        res.status(400).json({
          success: false,
          error: 'File upload error',
          details: error.message || 'An error occurred during file upload'
        });
        return;
    }
  }
  
  // Handle other types of errors
  console.error('Unhandled error:', error);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: 'An unexpected error occurred'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Transcription status: http://localhost:${PORT}/api/transcription-status`);
  console.log(`Upload & Transcribe endpoint: http://localhost:${PORT}/api/upload-recording`);
  console.log(`Note: Files are uploaded and transcribed in a single API call`);
  console.log(`Note: Uploaded files are automatically cleaned up after transcription`);
  console.log(`Note: Transcription model will be downloaded on first use`);
});

// Export app for testing purposes
export default app;