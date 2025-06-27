import React, { useRef, useState, useEffect } from "react";

const VideoRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>("idle");

  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        setMediaStream(stream);
        setError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setError("Could not access camera/microphone: " + err.message);
      });
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStart = () => {
    setStatusMessage("");
    if (!mediaStream) return;
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

  const uploadRecording = async (blob: Blob) => {
    setStatusMessage("Uploading...");
    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('videoBlob', blob, 'recording.webm');
    try {
      const response = await fetch('/api/upload-recording', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        setUploadStatus('success');
        const data = await response.json();
        setStatusMessage("Transcribing...");
        if (data.fileName) {
          // Call transcribe endpoint
          const transcribeRes = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: data.fileName }),
          });
          if (transcribeRes.ok) {
            const transcribeData = await transcribeRes.json();
            setTranscript(transcribeData.transcript || "");
            setStatusMessage("");
          } else {
            setTranscript("");
            setStatusMessage("Transcription failed.");
          }
        }
      } else {
        setUploadStatus('error');
        const errorText = await response.text();
        setStatusMessage("Upload failed: " + errorText);
      }
    } catch (err) {
      setUploadStatus('error');
      setStatusMessage("Error uploading recording: " + (err as Error).message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="border-4 border-gray-300 shadow-lg rounded-lg mb-4 bg-black"
        style={{ width: 400 }}
      />
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
      {statusMessage && (
        <div className="mb-2 text-blue-700 font-medium animate-pulse">{statusMessage}</div>
      )}
      {error && (
        <div className="mb-2 text-red-600 font-semibold bg-red-100 border border-red-300 rounded p-2 max-w-md text-center">
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
      {transcript && (
        <div className="mt-4 bg-white p-4 rounded shadow max-w-lg w-full">
          <strong className="block mb-2 text-gray-700">Transcript:</strong>
          <div className="whitespace-pre-line text-gray-900">{transcript}</div>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
