import { useState, useEffect, useCallback } from 'react';
import { ProctorSession } from '../types';
import { ProctorApiService } from '../services/api';

export function useProctorSession(sessionId?: string) {
  const [session, setSession] = useState<ProctorSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = async (
    userId: string,
    externalCallId: string,
    callPlatform: 'zoom' | 'meet' | 'teams' | 'other',
    metadata?: Record<string, string>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ProctorApiService.startSession({
        userId,
        externalCallId,
        callPlatform,
        metadata
      });
      
      if (response.success && response.data) {
        setSession(response.data);
      } else {
        setError(response.error || 'Failed to start session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      await ProctorApiService.endSession(session.id);
      setSession(prev => prev ? { ...prev, status: 'ended', endTime: new Date() } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await ProctorApiService.getSessionStatus(sessionId);
      if (response.success && response.data) {
        setSession(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      refreshSession();
    }
  }, [sessionId, refreshSession]);

  return {
    session,
    loading,
    error,
    startSession,
    endSession,
    refreshSession
  };
}
