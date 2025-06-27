// Create a modern Next.js 14 page component for the homepage.
// Import the VideoRecorder component from './VideoRecorder'.
// Render the VideoRecorder component inside the main element and add a title for the page.

import VideoRecorder from './VideoRecorder';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Exam Proctor: Video Recorder</h1>
      <VideoRecorder />
    </main>
  );
}
