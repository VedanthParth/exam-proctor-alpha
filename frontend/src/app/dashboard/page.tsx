'use client';

import { useEffect, useState } from 'react';
import { useProctorSession } from '../../hooks/useProctorSession';
import { useWebSocket } from '../../hooks/useWebSocket';
import { SessionStatus } from '../../components/SessionStatus';
import { SessionControls } from '../../components/SessionControls';
import { CallMonitoringData, ExternalCallWebhook } from '../../types';
import { ProctorApiService } from '../../services/api';

export default function Dashboard() {
  const { session, loading, error, startSession, endSession } = useProctorSession();
  const { 
    joinSession, 
    onMonitoringUpdate, 
    onExternalCallWebhook, 
    isConnected 
  } = useWebSocket();
  
  const [monitoringData, setMonitoringData] = useState<CallMonitoringData[]>([]);
  const [externalCallEvents, setExternalCallEvents] = useState<ExternalCallWebhook[]>([]);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    setConnectionStatus(isConnected());
    
    // Debug: Log the API URLs being used
    console.log('API_BASE_URL from env:', process.env.NEXT_PUBLIC_API_URL);
    console.log('WS_URL from env:', process.env.NEXT_PUBLIC_WS_URL);
    
    // Check API connection
    const checkApiConnection = async () => {
      try {
        await ProctorApiService.healthCheck();
        setApiStatus('connected');
      } catch (error) {
        console.error('API health check failed:', error);
        setApiStatus('disconnected');
      }
    };
    
    checkApiConnection();
  }, [isConnected]);

  useEffect(() => {
    if (session) {
      joinSession(session.id);
    }
  }, [session, joinSession]);

  useEffect(() => {
    const cleanupMonitoring = onMonitoringUpdate((data: CallMonitoringData) => {
      setMonitoringData(prev => [data, ...prev].slice(0, 50)); // Keep last 50 entries
    });

    const cleanupWebhook = onExternalCallWebhook((data: ExternalCallWebhook) => {
      setExternalCallEvents(prev => [data, ...prev].slice(0, 20)); // Keep last 20 events
    });

    return () => {
      cleanupMonitoring();
      cleanupWebhook();
    };
  }, [onMonitoringUpdate, onExternalCallWebhook]);

  const handleStartSession = async (
    userId: string,
    externalCallId: string,
    callPlatform: 'zoom' | 'meet' | 'teams' | 'other'
  ) => {
    const metadata = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      resolution: `${window.screen.width}x${window.screen.height}`
    };

    await startSession(userId, externalCallId, callPlatform, metadata);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exam Proctoring Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor external calls and track user behavior during examinations
          </p>
          
          {/* Connection Status */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                WebSocket: {connectionStatus ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                apiStatus === 'connected' ? 'bg-green-500' : 
                apiStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                API: {apiStatus === 'connected' ? 'Connected' : 
                      apiStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
              </span>
              {apiStatus === 'disconnected' && (
                <span className="text-xs text-red-600">
                  (Backend may not be running on port 8081)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Session Controls */}
          <SessionControls
            session={session}
            onStartSession={handleStartSession}
            onEndSession={endSession}
            loading={loading}
          />

          {/* Session Status */}
          <SessionStatus session={session} loading={loading} />
        </div>

        {/* Monitoring Data */}
        {session && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Monitoring */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Real-time Monitoring Data
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {monitoringData.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No monitoring data yet...
                  </p>
                ) : (
                  monitoringData.map((data, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">
                          {new Date(data.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          Session: {data.sessionId.slice(-8)}
                        </span>
                      </div>
                      
                      {data.gazeData && (
                        <div className="mb-2">
                          <span className="text-gray-700 font-medium">Gaze: </span>
                          <span className={data.gazeData.lookingAway ? 'text-red-600' : 'text-green-600'}>
                            {data.gazeData.lookingAway ? '👀 Looking Away' : '👁️ Focused'}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({Math.round(data.gazeData.confidence * 100)}% confidence)
                          </span>
                        </div>
                      )}
                      
                      {data.audioData && (
                        <div className="mb-2">
                          <span className="text-gray-700 font-medium">Audio: </span>
                          <span className={data.audioData.multipleVoices ? 'text-red-600' : 'text-green-600'}>
                            {data.audioData.multipleVoices ? '🔊 Multiple Voices' : '🎤 Single Voice'}
                          </span>
                          <span className="text-gray-500 ml-2">
                            (Vol: {Math.round(data.audioData.volume * 100)}%)
                          </span>
                        </div>
                      )}
                      
                      {data.suspiciousActivity && data.suspiciousActivity.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-red-700 font-medium text-xs">⚠️ Suspicious Activity:</span>
                          {data.suspiciousActivity.map((activity, i) => (
                            <div key={i} className="text-xs text-red-600 mt-1">
                              {activity.description} ({activity.severity})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* External Call Events */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                External Call Events
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {externalCallEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No call events yet...
                  </p>
                ) : (
                  externalCallEvents.map((event, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-blue-900 capitalize">
                          {event.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-blue-600">
                          {event.platform}
                        </span>
                      </div>
                      
                      <div className="text-blue-800">
                        <div>Call ID: {event.callId}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                        
                        {event.participants && event.participants.length > 0 && (
                          <div className="mt-2">
                            <span className="text-blue-700 font-medium">Participants:</span>
                            <div className="mt-1 space-y-1">
                              {event.participants.map((participant, i) => (
                                <div key={i} className="text-xs text-blue-600">
                                  {participant.name} ({participant.role})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
