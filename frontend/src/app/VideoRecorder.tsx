import React, { useRef, useState, useEffect } from "react";

const VideoRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setIsRecording(true);
    // Add recording logic here
  };

  const handleStop = () => {
    setIsRecording(false);
    // Add stop logic here
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline style={{ width: 400 }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={handleStart} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={handleStop} disabled={!isRecording} style={{ marginLeft: 8 }}>
          Stop Recording
        </button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
};

export default VideoRecorder;
