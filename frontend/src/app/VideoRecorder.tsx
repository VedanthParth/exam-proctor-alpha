"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface Recording {
  id: string;
  filename: string;
  originalname: string;
  size: number;
  mimetype: string;
  uploadDate: string;
  transcriptStatus: 'pending' | 'processing' | 'completed' | 'failed';
  transcript?: string;
  confidence?: number;
  url: string;
}

const VideoRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>("idle");
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    let stream: MediaStream;
    
    // Check if we're in the browser environment
    if (typeof window === 'undefined') {
      // Server-side rendering - do nothing
      return;
    }

    // Check for getUserMedia support with more detailed detection
    const hasGetUserMedia = !!(
      navigator &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );

    if (hasGetUserMedia) {
      console.log('Attempting to access camera and microphone...');
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((s) => {
          console.log('Successfully got media stream');
          stream = s;
          setMediaStream(stream);
          setError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error('getUserMedia error:', err);
          let errorMessage = "Could not access camera/microphone: ";
          
          if (err.name === 'NotAllowedError') {
            errorMessage += "Permission denied. Please allow camera and microphone access.";
          } else if (err.name === 'NotFoundError') {
            errorMessage += "No camera or microphone found.";
          } else if (err.name === 'NotReadableError') {
            errorMessage += "Camera or microphone is already in use.";
          } else if (err.name === 'OverconstrainedError') {
            errorMessage += "Camera or microphone constraints could not be satisfied.";
          } else {
            errorMessage += err.message || "Unknown error occurred.";
          }
          
          setError(errorMessage);
        });
    } else {
      // Check what's missing to provide more specific error
      let errorDetails = "Camera/microphone access is not supported: ";
      
      if (!navigator) {
        errorDetails += "Navigator not available.";
      } else if (!navigator.mediaDevices) {
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!isHttps && !isLocalhost) {
          errorDetails += "MediaDevices API requires HTTPS. Please access this site over HTTPS.";
        } else {
          errorDetails += "MediaDevices API not available in this browser.";
        }
      } else if (!navigator.mediaDevices.getUserMedia) {
        errorDetails += "getUserMedia API not available in this browser.";
      } else {
        errorDetails += "Unknown compatibility issue.";
      }
      
      console.error('Media access not supported:', errorDetails);
      setError(errorDetails);
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStart = () => {
    setStatusMessage("");
    if (!mediaStream) return;
    
    // Check if MediaRecorder is available
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      setError("Video recording is not supported in this browser");
      return;
    }
    
    chunksRef.current = [];
    const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      uploadRecording(blob);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setUploadStatus('uploading');
    }
    setIsRecording(false);
  };

  // Get API URL from environment or fallback to localhost
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      // Client-side: check for environment variable first
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        return apiUrl;
      }
      
      // For development: use HTTP for backend API even if frontend is HTTPS
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // Use HTTP for backend API on network IP
        return `http://${hostname}:8000`;
      }
      
      return 'http://localhost:8000';
    }
    // Fallback to HTTP for server-side rendering
    return 'http://localhost:8000';
  };

  // Load recordings from backend
  const loadRecordings = useCallback(async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/recordings`);
      if (response.ok) {
        const data = await response.json();
        setRecordings(data.recordings || []);
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  }, []);

  // Load recordings on component mount
  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const uploadRecording = async (blob: Blob) => {
    setStatusMessage("Uploading recording...");
    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('videoBlob', blob, 'recording.webm');
    
    try {
      // Call the backend API
      const response = await fetch(`${getApiUrl()}/api/upload-recording`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadStatus('success');
        setStatusMessage("Recording uploaded successfully!");
        
        // Reload recordings to show the new one
        loadRecordings();
        
        console.log('Upload successful:', data);
      } else {
        setUploadStatus('error');
        const errorData = await response.json();
        setStatusMessage(`Upload failed: ${errorData.error || response.statusText}`);
        console.error('Upload failed:', errorData);
      }
    } catch (err) {
      setUploadStatus('error');
      setStatusMessage("Error connecting to server: " + (err as Error).message);
      console.error('Network error:', err);
    }
  };

  // Generate transcript for a recording
  const generateTranscript = async (recordingId: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/recordings/${recordingId}/transcribe`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the recording in our local state
        setRecordings(prev => prev.map(rec => 
          rec.id === recordingId ? { ...rec, ...data.recording } : rec
        ));
      }
    } catch (error) {
      console.error('Failed to generate transcript:', error);
    }
  };

  // Delete a recording
  const deleteRecording = async (recordingId: string, recordingName: string) => {
    if (!confirm(`Are you sure you want to delete "${recordingName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/recordings/${recordingId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the recording from local state
        setRecordings(prev => prev.filter(rec => rec.id !== recordingId));
        console.log('Recording deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete recording:', errorData);
        alert(`Failed to delete recording: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      alert('Failed to delete recording. Please check your connection.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Video Recorder</h2>
      
      {/* Camera Preview */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="border-4 border-gray-300 shadow-lg rounded-lg mb-4 bg-black"
        style={{ width: 400 }}
      />
      
      {/* Recording Controls */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleStart}
          disabled={isRecording || !mediaStream}
          className={`px-6 py-2 rounded font-semibold text-white shadow transition-colors duration-200 ${isRecording || !mediaStream ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          Start Recording
        </button>
        <button
          onClick={handleStop}
          disabled={!isRecording}
          className={`px-6 py-2 rounded font-semibold text-white shadow transition-colors duration-200 ${!isRecording ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
        >
          Stop Recording
        </button>
      </div>
      
      {/* Status Messages */}
      {statusMessage && (
        <div className="mb-2 text-blue-700 font-medium animate-pulse">{statusMessage}</div>
      )}
      {error && (
        <div className="mb-4 text-red-600 font-semibold bg-red-100 border border-red-300 rounded p-2 max-w-md text-center">
          {error}
        </div>
      )}
      {uploadStatus === 'uploading' && (
        <div className="mb-2 text-blue-700 font-medium animate-pulse">Uploading...</div>
      )}
      {uploadStatus === 'success' && (
        <div className="mb-2 text-green-700 font-medium">Upload successful!</div>
      )}
      {uploadStatus === 'error' && (
        <div className="mb-2 text-red-700 font-medium">Upload failed.</div>
      )}

      {/* Recordings List */}
      <div className="mt-8 w-full max-w-4xl">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Stored Recordings</h3>
        {recordings.length === 0 ? (
          <p className="text-gray-600">No recordings yet. Start recording to create your first recording!</p>
        ) : (
          <div className="grid gap-4">
            {recordings.map((recording) => (
              <div key={recording.id} className="bg-white p-4 rounded-lg shadow-md border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{recording.originalname}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {new Date(recording.uploadDate).toLocaleString()}
                    </span>
                    <button
                      onClick={() => deleteRecording(recording.id, recording.originalname)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium transition-colors"
                      title="Delete recording"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    Size: {(recording.size / 1024 / 1024).toFixed(2)} MB • 
                    Type: {recording.mimetype} •
                    Status: <span className={`font-medium ${
                      recording.transcriptStatus === 'completed' ? 'text-green-600' :
                      recording.transcriptStatus === 'processing' ? 'text-blue-600' :
                      recording.transcriptStatus === 'failed' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {recording.transcriptStatus}
                    </span>
                  </p>
                </div>

                {/* Video/Audio Player */}
                <div className="mb-3">
                  {recording.mimetype.startsWith('video/') ? (
                    <video
                      controls
                      className="w-full max-w-md rounded"
                      style={{ maxHeight: '200px' }}
                    >
                      <source src={recording.url} type={recording.mimetype} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <audio controls className="w-full">
                      <source src={recording.url} type={recording.mimetype} />
                      Your browser does not support the audio tag.
                    </audio>
                  )}
                </div>

                {/* Transcript Section */}
                <div className="mb-3">
                  {recording.transcriptStatus === 'pending' && (
                    <button
                      onClick={() => generateTranscript(recording.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Generate Transcript
                    </button>
                  )}
                  
                  {recording.transcriptStatus === 'processing' && (
                    <div className="text-blue-600 text-sm animate-pulse">Generating transcript...</div>
                  )}
                  
                  {recording.transcriptStatus === 'completed' && recording.transcript && (
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <strong className="text-gray-700">Transcript:</strong>
                        {recording.confidence && (
                          <span className="text-sm text-gray-500">
                            Confidence: {(recording.confidence * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="whitespace-pre-line text-gray-900 text-sm">
                        {recording.transcript}
                      </div>
                    </div>
                  )}
                  
                  {recording.transcriptStatus === 'failed' && (
                    <div className="text-red-600 text-sm">
                      Transcript generation failed. 
                      <button
                        onClick={() => generateTranscript(recording.id)}
                        className="ml-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Recording Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => deleteRecording(recording.id, recording.originalname)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete Recording
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;
