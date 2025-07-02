import crypto from 'crypto';

export class AuthUtil {
  private static readonly API_KEY = process.env.API_KEY || 'default-api-key';
  
  static authenticate(providedKey: string): boolean {
    if (!providedKey) {
      return false;
    }
    
    // Remove "Bearer " prefix if present
    const cleanKey = providedKey.replace(/^Bearer\s+/, '');
    
    return cleanKey === this.API_KEY;
  }
  
  static generateSessionToken(userId: string, sessionId: string): string {
    const data = `${userId}:${sessionId}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  static validateSessionToken(token: string, userId: string, sessionId: string): boolean {
    // Simple validation - in production, implement proper JWT or similar
    return token.length === 64; // SHA256 hash length
  }
}
