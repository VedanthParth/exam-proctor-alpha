'use client';

import { ProctorSession } from '../types';

interface SessionStatusProps {
  session: ProctorSession | null;
  loading?: boolean;
}

export function SessionStatus({ session, loading }: SessionStatusProps) {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-4 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-gray-600">Loading session...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <span className="text-gray-600">No active session</span>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      case 'recording':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'paused':
        return '⏸️';
      case 'ended':
        return '⏹️';
      case 'recording':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Session Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(session.status)}`}>
          <span>{getStatusIcon(session.status)}</span>
          <span className="capitalize">{session.status}</span>
        </span>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Session ID:</span>
          <span className="font-mono text-gray-900">{session.id}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">User ID:</span>
          <span className="font-mono text-gray-900">{session.userId}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Call Platform:</span>
          <span className="capitalize text-gray-900">{session.callPlatform}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">External Call ID:</span>
          <span className="font-mono text-gray-900">{session.externalCallId}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Started:</span>
          <span className="text-gray-900">
            {new Date(session.startTime).toLocaleString()}
          </span>
        </div>
        
        {session.endTime && (
          <div className="flex justify-between">
            <span className="text-gray-600">Ended:</span>
            <span className="text-gray-900">
              {new Date(session.endTime).toLocaleString()}
            </span>
          </div>
        )}

        {session.metadata && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <span className="text-gray-600 font-medium">Metadata:</span>
            <div className="mt-2 space-y-1">
              {Object.entries(session.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-500 capitalize">{key}:</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
