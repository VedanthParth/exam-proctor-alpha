import { io, Socket } from 'socket.io-client';
import { CallMonitoringData, ExternalCallWebhook } from '../types';

export class WebSocketService {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor() {
    // Use environment variable or fallback to localhost
    this.serverUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'; 
    console.log('WebSocket connecting to:', this.serverUrl);
    console.log('Environment WS URL:', process.env.NEXT_PUBLIC_WS_URL);
    console.log('Environment API URL:', process.env.NEXT_PUBLIC_API_URL);
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    try {
      this.socket = io(this.serverUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true,
        // Add transport options for better compatibility
        transports: ['websocket', 'polling'],
        // Disable CORS for development
        withCredentials: false
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        console.log('This is normal if the backend WebSocket is not running. The app will continue to function without real-time features.');
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to WebSocket server after', attemptNumber, 'attempts');
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('WebSocket reconnection error:', error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed after maximum attempts. Real-time features will be unavailable.');
      });
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.socket = null;
    }
  }

  disconnect(): void {
    try {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    } catch (error) {
      console.error('Error disconnecting WebSocket:', error);
    }
  }

  joinSession(sessionId: string): void {
    try {
      if (this.socket?.connected) {
        this.socket.emit('join-session', sessionId);
      } else {
        console.warn('WebSocket not connected, cannot join session:', sessionId);
      }
    } catch (error) {
      console.error('Error joining session:', error);
    }
  }

  sendMonitoringData(data: CallMonitoringData): void {
    try {
      if (this.socket?.connected) {
        this.socket.emit('monitoring-data', data);
      } else {
        console.warn('WebSocket not connected, cannot send monitoring data');
      }
    } catch (error) {
      console.error('Error sending monitoring data:', error);
    }
  }

  sendExternalCallEvent(eventData: ExternalCallWebhook): void {
    try {
      if (this.socket?.connected) {
        this.socket.emit('external-call-event', eventData);
      } else {
        console.warn('WebSocket not connected, cannot send external call event');
      }
    } catch (error) {
      console.error('Error sending external call event:', error);
    }
  }

  onMonitoringUpdate(callback: (data: CallMonitoringData) => void): void {
    try {
      if (this.socket) {
        this.socket.on('monitoring-update', callback);
      }
    } catch (error) {
      console.error('Error setting up monitoring update listener:', error);
    }
  }

  onCallEvent(callback: (data: ExternalCallWebhook) => void): void {
    if (this.socket) {
      this.socket.on('call-event', callback);
    }
  }

  onExternalCallWebhook(callback: (data: ExternalCallWebhook) => void): void {
    if (this.socket) {
      this.socket.on('external-call-webhook', callback);
    }
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const webSocketService = new WebSocketService();
