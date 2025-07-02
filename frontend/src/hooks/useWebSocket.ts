import { useEffect, useCallback } from 'react';
import { webSocketService } from '../services/websocket';
import { CallMonitoringData, ExternalCallWebhook } from '../types';

export function useWebSocket() {
  useEffect(() => {
    try {
      webSocketService.connect();
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
    }

    return () => {
      try {
        webSocketService.disconnect();
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error);
      }
    };
  }, []);

  const joinSession = useCallback((sessionId: string) => {
    webSocketService.joinSession(sessionId);
  }, []);

  const sendMonitoringData = useCallback((data: CallMonitoringData) => {
    webSocketService.sendMonitoringData(data);
  }, []);

  const sendExternalCallEvent = useCallback((eventData: ExternalCallWebhook) => {
    webSocketService.sendExternalCallEvent(eventData);
  }, []);

  const onMonitoringUpdate = useCallback((callback: (data: CallMonitoringData) => void) => {
    webSocketService.onMonitoringUpdate(callback);
    
    return () => {
      webSocketService.off('monitoring-update');
    };
  }, []);

  const onCallEvent = useCallback((callback: (data: ExternalCallWebhook) => void) => {
    webSocketService.onCallEvent(callback);
    
    return () => {
      webSocketService.off('call-event');
    };
  }, []);

  const onExternalCallWebhook = useCallback((callback: (data: ExternalCallWebhook) => void) => {
    webSocketService.onExternalCallWebhook(callback);
    
    return () => {
      webSocketService.off('external-call-webhook');
    };
  }, []);

  const isConnected = useCallback(() => {
    return webSocketService.isConnected();
  }, []);

  return {
    joinSession,
    sendMonitoringData,
    sendExternalCallEvent,
    onMonitoringUpdate,
    onCallEvent,
    onExternalCallWebhook,
    isConnected
  };
}
