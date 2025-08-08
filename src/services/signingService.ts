import { io, Socket } from 'socket.io-client';

export interface SigningSession {
  id: string;
  title: string;
  message: string;
  status: 'active' | 'completed' | 'cancelled';
  signers: Signer[];
  signatureFields: SignatureField[];
  createdAt: Date;
  completedAt?: Date;
}

export interface Signer {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'approver' | 'viewer';
  status: 'pending' | 'signed' | 'declined';
  signedAt?: Date;
  color: string;
  accessToken: string;
}

export interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  assignedTo?: string;
  required: boolean;
  value?: string;
  signed?: boolean;
}

export interface SigningUpdate {
  type: 'signer_signed' | 'signer_declined' | 'document_completed' | 'session_update';
  sessionId: string;
  data: any;
  timestamp: Date;
}

class SigningService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  initializeRealTime(sessionId: string) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');

    this.socket.on('connect', () => {
      console.log('Connected to signing service');
      this.socket?.emit('join_session', { sessionId, userId: 'current_user' });
    });

    this.socket.on('session_update', (update: SigningUpdate) => {
      this.notifyListeners('session_update', update);
    });

    this.socket.on('signer_signed', (data) => {
      this.notifyListeners('signer_signed', data);
    });

    this.socket.on('document_completed', (data) => {
      this.notifyListeners('document_completed', data);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signing service');
    });
  }

  /**
   * Create a new signing session
   */
  async createSigningSession(
    file: File,
    title: string,
    message: string,
    signers: Omit<Signer, 'id' | 'status' | 'accessToken' | 'color'>[],
    signatureFields: Omit<SignatureField, 'id' | 'signed'>[]
  ): Promise<{ sessionId: string; success: boolean }> {
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('title', title);
      formData.append('message', message);
      formData.append('signers', JSON.stringify(signers));
      formData.append('signatureFields', JSON.stringify(signatureFields));

      const response = await fetch(`${this.baseUrl}/pdf-signing/create-session`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        // Initialize real-time connection for this session
        this.initializeRealTime(result.sessionId);
      }

      return result;
    } catch (error) {
      console.error('Error creating signing session:', error);
      throw new Error('Failed to create signing session');
    }
  }

  /**
   * Get signing session details
   */
  async getSession(sessionId: string, token?: string): Promise<SigningSession> {
    try {
      const url = new URL(`${this.baseUrl}/pdf-signing/session/${sessionId}`);
      if (token) {
        url.searchParams.append('token', token);
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get session');
      }

      return result.session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  /**
   * Sign a document
   */
  async signDocument(
    sessionId: string,
    token: string,
    signatures: { fieldId: string; value: string }[]
  ): Promise<{ success: boolean; allSigned: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/pdf-signing/sign/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          signatures,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error signing document:', error);
      throw new Error('Failed to sign document');
    }
  }

  /**
   * Get session status with real-time updates
   */
  async getSessionStatus(sessionId: string): Promise<{
    sessionId: string;
    title: string;
    status: string;
    signers: any[];
    progress: {
      signed: number;
      total: number;
      percentage: number;
    };
    createdAt: Date;
    completedAt?: Date;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/pdf-signing/status/${sessionId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get session status');
      }

      return result.status;
    } catch (error) {
      console.error('Error getting session status:', error);
      throw error;
    }
  }

  /**
   * Download signed document
   */
  async downloadSignedDocument(sessionId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/pdf-signing/download/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  /**
   * Send reminder to signers
   */
  async sendReminder(sessionId: string, signerIds?: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/pdf-signing/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          signerIds,
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error sending reminder:', error);
      return false;
    }
  }

  /**
   * Cancel signing session
   */
  async cancelSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/pdf-signing/cancel/${sessionId}`, {
        method: 'POST',
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error cancelling session:', error);
      return false;
    }
  }

  /**
   * Add event listener for real-time updates
   */
  addEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Disconnect from real-time service
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Generate signing URL for a signer
   */
  generateSigningUrl(sessionId: string, token: string): string {
    const baseUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
    return `${baseUrl}/sign-document/${sessionId}?token=${token}`;
  }

  /**
   * Validate signature field placement
   */
  validateSignatureField(field: Partial<SignatureField>, pageWidth: number, pageHeight: number): boolean {
    if (!field.x || !field.y || !field.width || !field.height) {
      return false;
    }

    // Check if field is within page bounds
    if (field.x < 0 || field.y < 0) {
      return false;
    }

    if (field.x + field.width > pageWidth || field.y + field.height > pageHeight) {
      return false;
    }

    return true;
  }

  /**
   * Get signing analytics
   */
  async getSigningAnalytics(sessionId: string): Promise<{
    totalTime: number;
    signerAnalytics: {
      signerId: string;
      timeToSign: number;
      deviceType: string;
      location?: string;
    }[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/pdf-signing/analytics/${sessionId}`);
      const result = await response.json();
      return result.analytics;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const signingService = new SigningService();
export default signingService;
