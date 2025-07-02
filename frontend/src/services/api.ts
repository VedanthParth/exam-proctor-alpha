import axios from 'axios';
import { ProctorSession, ApiResponse, SessionStartRequest } from '../types';

// Force HTTP for backend communication - safer for development
// Use multiple fallback methods to ensure we always have a valid URL
const getApiBaseUrl = (): string => {
  // Try environment variable first
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl !== 'undefined' && envUrl.trim() !== '') {
      return envUrl.trim();
    }
  }
  
  // Fallback to hardcoded localhost
  return 'http://localhost:8081';
};

const getApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
    const envKey = process.env.NEXT_PUBLIC_API_KEY;
    if (envKey && envKey !== 'undefined' && envKey.trim() !== '') {
      return envKey.trim();
    }
  }
  
  return 'exam-proctor-dev-key-2025';
};

const API_BASE_URL = getApiBaseUrl();
const API_KEY = getApiKey();

// Debug environment variables
console.log('Environment debug:', {
  NEXT_PUBLIC_API_URL: typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL : 'process not available',
  NEXT_PUBLIC_API_KEY: typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_KEY : 'process not available',
  resolvedURL: API_BASE_URL,
  resolvedKey: API_KEY
});

// Validate API_BASE_URL
if (!API_BASE_URL || API_BASE_URL === 'undefined' || API_BASE_URL.trim() === '') {
  console.error('API_BASE_URL is invalid:', API_BASE_URL);
  throw new Error('API_BASE_URL is not properly configured');
}

// Test URL validity with better error handling
try {
  const testUrl = new URL(API_BASE_URL);
  console.log('Valid API URL constructed:', testUrl.toString());
} catch (urlError) {
  console.error('Invalid API_BASE_URL:', API_BASE_URL, urlError);
  console.error('URL Error details:', {
    input: API_BASE_URL,
    type: typeof API_BASE_URL,
    length: API_BASE_URL?.length,
    charCodes: API_BASE_URL ? Array.from(API_BASE_URL).map(c => c.charCodeAt(0)) : 'N/A'
  });
  throw new Error(`Invalid API_BASE_URL: "${API_BASE_URL}". Expected format: http://localhost:8081`);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  // Handle mixed content warnings and CORS
  withCredentials: false,
  timeout: 10000, // 10 second timeout
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  }
});

// Debug logging
console.log('API Configuration:', {
  baseURL: API_BASE_URL,
  apiKey: API_KEY,
  authHeader: `Bearer ${API_KEY}`
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response received:`, response.status, response.statusText);
    return response;
  },
  (error) => {
    console.error('Response interceptor error:', error);
    
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error detected - backend may be unreachable');
    } else if (error.response) {
      console.error('Server responded with error:', error.response.status, error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export class ProctorApiService {
  
  static async startSession(request: SessionStartRequest): Promise<ApiResponse<ProctorSession>> {
    try {
      console.log('Starting session with API URL:', API_BASE_URL);
      const response = await apiClient.post('/api/sessions/start', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Error starting session:', error);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running.`);
      } else if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data?: { message?: string }; statusText: string } };
        throw new Error(`Server error: ${axiosError.response.status} - ${axiosError.response.data?.message || axiosError.response.statusText}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Network error: ${errorMessage}`);
      }
    }
  }
  
  static async endSession(sessionId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(`/api/sessions/${sessionId}/end`);
      return response.data;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }
  
  static async getSessionStatus(sessionId: string): Promise<ApiResponse<ProctorSession>> {
    try {
      const response = await apiClient.get(`/api/sessions/${sessionId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting session status:', error);
      throw error;
    }
  }
  
  static async getActiveSessions(): Promise<ApiResponse<ProctorSession[]>> {
    try {
      const response = await apiClient.get('/api/sessions/active');
      return response.data;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }
  
  static async getSessionHistory(userId: string): Promise<ApiResponse<ProctorSession[]>> {
    try {
      const response = await apiClient.get(`/api/sessions/history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting session history:', error);
      throw error;
    }
  }
  
  static async uploadRecording(
    sessionId: string,
    recordingType: 'video' | 'audio' | 'screen',
    file: File
  ): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('recordingType', recordingType);
      formData.append('recording', file);
      
      const response = await apiClient.post('/api/recordings/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw error;
    }
  }
  
  static getRecordingUrl(sessionId: string, recordingType: 'video' | 'audio' | 'screen'): string {
    return `${API_BASE_URL}/api/recordings/${sessionId}/${recordingType}`;
  }
  
  static async deleteRecording(sessionId: string, recordingType: 'video' | 'audio' | 'screen'): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(`/api/recordings/${sessionId}/${recordingType}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }
  
  static async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    try {
      console.log('Checking health at URL:', `${API_BASE_URL}/health`);
      
      // Construct the full URL manually to avoid URL constructor issues
      const healthUrl = `${API_BASE_URL}/health`;
      console.log('Health URL constructed:', healthUrl);
      
      // First try with the configured axios instance
      try {
        const response = await apiClient.get('/health');
        console.log('Health check successful with apiClient:', response.data);
        return response.data;
      } catch (apiClientError) {
        console.warn('Health check failed with apiClient, trying direct axios:', apiClientError);
        
        // Fallback to direct axios call with minimal configuration
        const response = await axios({
          method: 'get',
          url: healthUrl,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json'
          },
          withCredentials: false,
          timeout: 5000,
          // Additional options to handle network issues
          maxRedirects: 0,
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          }
        });
        
        console.log('Health check successful with direct axios:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Health check failed:', error);
      
      // Provide more detailed error information
      if (error && typeof error === 'object') {
        if ('code' in error) {
          const networkError = error as { code: string; message: string };
          if (networkError.code === 'ERR_NETWORK') {
            throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running and accessible.`);
          } else if (networkError.code === 'ECONNREFUSED') {
            throw new Error(`Connection refused to ${API_BASE_URL}. Backend server may not be running.`);
          } else if (networkError.code === 'ERR_BLOCKED_BY_CLIENT') {
            throw new Error(`Request blocked by browser security. Check CORS configuration.`);
          }
        }
        
        if ('response' in error) {
          const axiosError = error as { response: { status: number; data?: { message?: string }; statusText: string } };
          throw new Error(`Server error: ${axiosError.response.status} - ${axiosError.response.data?.message || axiosError.response.statusText}`);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Network error: ${errorMessage}`);
    }
  }
}

export default ProctorApiService;
