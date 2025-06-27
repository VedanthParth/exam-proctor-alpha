import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
// import { pipeline } from '@xenova/transformers'; // Temporarily disabled due to sharp module issues

// Create uploads/recordings directory if it doesn't exist
const createUploadsDir = async () => {
  try {
    await fs.mkdir('./uploads/recordings', { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
};
createUploadsDir();

// Configure Multer storage for permanent file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/recordings/'); // Store files in the uploads/recordings directory
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
const uploadVideoBlob = upload.single('videoBlob');

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
    // Temporarily using simulation due to sharp module issues
    // TODO: Replace with real AI when sharp is fixed
    console.log('Using simulated transcription (AI temporarily disabled due to sharp module issues)');
    return { 
      simulate: true,
      name: 'simulated-whisper'
    };
  }

  async transcribe(filePath: string): Promise<{ transcript: string; confidence: number; processingTime: string }> {
    const startTime = Date.now();
    
    try {
      // Validate file exists
      await fs.access(filePath);
      
      console.log('Loading transcription model...');
      const transcriber = await this.loadModel();
      
      console.log('Processing audio file for transcription...');
      
      // Temporarily using simulation
      const fileName = path.basename(filePath);
      const simulatedResult = {
        text: `This is a simulated transcript for ${fileName}. The audio contained speech that would be processed by a real Speech-to-Text service. This is placeholder text for proof of concept purposes while we resolve the sharp module dependency issue.`
      };
      
      const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
      
      return {
        transcript: simulatedResult.text || 'No speech detected in the audio file.',
        confidence: 0.95, // Simulated confidence score
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

// Simple in-memory storage for recordings (replace with database in production)
interface Recording {
  id: string;
  filename: string;
  originalname: string;
  path: string;
  size: number;
  mimetype: string;
  uploadDate: string;
  transcriptStatus: 'pending' | 'processing' | 'completed' | 'failed';
  transcript?: string;
  confidence?: number;
  processingTime?: string;
}

let recordings: Recording[] = [];

// Async transcription function using the singleton service
async function transcribeAudio(filePath: string): Promise<{ transcript: string; confidence: number; processingTime: string }> {
  return await transcriptionService.transcribe(filePath);
}

// Create Express app
const app: express.Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3001',
    'https://localhost:3001',
    'http://localhost:3003',
    'https://localhost:3003'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Serve static files from uploads/recordings directory
app.use('/recordings', express.static(path.join(__dirname, '../uploads/recordings')));

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

// Get all recordings
app.get('/api/recordings', (req: Request, res: Response) => {
  res.json({
    success: true,
    recordings: recordings.map(recording => ({
      ...recording,
      url: `http://localhost:${PORT}/recordings/${recording.filename}`
    })),
    count: recordings.length
  });
});

// Get specific recording
app.get('/api/recordings/:id', (req: Request, res: Response) => {
  const recording = recordings.find(r => r.id === req.params.id);
  if (!recording) {
    res.status(404).json({
      success: false,
      error: 'Recording not found'
    });
    return;
  }
  
  res.json({
    success: true,
    recording: {
      ...recording,
      url: `http://localhost:${PORT}/recordings/${recording.filename}`
    }
  });
});

// Generate transcript for a recording
app.post('/api/recordings/:id/transcribe', async (req: Request, res: Response): Promise<void> => {
  const recording = recordings.find(r => r.id === req.params.id);
  if (!recording) {
    res.status(404).json({
      success: false,
      error: 'Recording not found'
    });
    return;
  }

  if (recording.transcriptStatus === 'processing') {
    res.status(400).json({
      success: false,
      error: 'Transcription already in progress'
    });
    return;
  }

  // Update status to processing
  recording.transcriptStatus = 'processing';

  try {
    console.log('Starting transcription for recording:', recording.id);
    const transcriptionResult = await transcribeAudio(recording.path);
    
    // Update recording with transcript
    recording.transcriptStatus = 'completed';
    recording.transcript = transcriptionResult.transcript;
    recording.confidence = transcriptionResult.confidence;
    recording.processingTime = transcriptionResult.processingTime;

    res.json({
      success: true,
      message: 'Transcript generated successfully',
      recording: {
        ...recording,
        url: `http://localhost:${PORT}/recordings/${recording.filename}`
      }
    });
  } catch (error) {
    console.error('Transcription failed for recording:', recording.id, error);
    
    // Update status to failed
    recording.transcriptStatus = 'failed';
    
    res.status(500).json({
      success: false,
      error: 'Transcription failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// POST endpoint for file upload - now stores files permanently
app.post('/api/upload-recording', uploadVideoBlob, async (req: express.Request, res: express.Response): Promise<void> => {
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

    // Create recording record
    const recording: Recording = {
      id: uuidv4(),
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadDate: new Date().toISOString(),
      transcriptStatus: 'pending'
    };

    // Store recording in memory (in production, use a database)
    recordings.push(recording);

    // Send success response with recording details
    res.json({
      success: true,
      message: 'File uploaded and stored successfully',
      recording: {
        ...recording,
        url: `http://localhost:${PORT}/recordings/${recording.filename}`
      }
    });

  } catch (error) {
    console.error('Unexpected error in upload endpoint:', error);
    
    // Check if response was already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: 'An unexpected error occurred during file upload'
      });
    }
  }
  // Note: Files are now stored permanently and NOT deleted
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
  console.log(`Upload & Store recordings: http://localhost:${PORT}/api/upload-recording`);
  console.log(`Get recordings: http://localhost:${PORT}/api/recordings`);
  console.log(`Recordings served at: http://localhost:${PORT}/recordings/`);
  console.log(`Note: Files are now stored permanently for playback`);
  console.log(`Note: Transcript generation is available on-demand per recording`);
});

// Export app for testing purposes
export default app;