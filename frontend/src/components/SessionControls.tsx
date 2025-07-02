'use client';

import { useState } from 'react';
import { ProctorSession } from '../types';

interface SessionControlsProps {
  session: ProctorSession | null;
  onStartSession: (
    userId: string,
    externalCallId: string,
    callPlatform: 'zoom' | 'meet' | 'teams' | 'other'
  ) => Promise<void>;
  onEndSession: () => Promise<void>;
  loading?: boolean;
}

export function SessionControls({ 
  session, 
  onStartSession, 
  onEndSession, 
  loading 
}: SessionControlsProps) {
  const [formData, setFormData] = useState({
    userId: '',
    externalCallId: '',
    callPlatform: 'meet' as 'zoom' | 'meet' | 'teams' | 'other'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.externalCallId) {
      alert('Please fill in all required fields');
      return;
    }
    
    await onStartSession(
      formData.userId,
      formData.externalCallId,
      formData.callPlatform
    );
  };

  const handleEndSession = async () => {
    if (window.confirm('Are you sure you want to end this proctoring session?')) {
      await onEndSession();
    }
  };

  if (session && session.status !== 'ended') {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Controls</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">🟢</span>
              <span className="text-green-800 font-medium">
                Monitoring session {session.id}
              </span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Tracking external call: {session.externalCallId}
            </p>
          </div>

          <button
            onClick={handleEndSession}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Ending Session...' : 'End Proctoring Session'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Start New Proctoring Session</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
            User ID *
          </label>
          <input
            type="text"
            id="userId"
            value={formData.userId}
            onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
            placeholder="Enter user ID to monitor"
            required
          />
        </div>

        <div>
          <label htmlFor="externalCallId" className="block text-sm font-medium text-gray-700 mb-1">
            External Call ID *
          </label>
          <input
            type="text"
            id="externalCallId"
            value={formData.externalCallId}
            onChange={(e) => setFormData(prev => ({ ...prev, externalCallId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
            placeholder="Enter the call/meeting ID to monitor"
            required
          />
        </div>

        <div>
          <label htmlFor="callPlatform" className="block text-sm font-medium text-gray-700 mb-1">
            Call Platform *
          </label>
          <select
            id="callPlatform"
            value={formData.callPlatform}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              callPlatform: e.target.value as 'zoom' | 'meet' | 'teams' | 'other'
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            <option value="meet">Google Meet</option>
            <option value="zoom">Zoom</option>
            <option value="teams">Microsoft Teams</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Starting Session...' : 'Start Proctoring Session'}
        </button>
      </form>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 mt-0.5">ℹ️</span>
          <div className="text-blue-800 text-sm">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="space-y-1 text-xs">
              <li>• Enter the user ID you want to monitor</li>
              <li>• Provide the external call ID (meeting room ID)</li>
              <li>• Select the call platform being used</li>
              <li>• The system will monitor gaze, audio, and behavior</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
