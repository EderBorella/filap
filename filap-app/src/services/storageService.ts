/**
 * Local storage service for managing user tokens, host secrets, and other client-side data
 */

export interface StoredQueueData {
  queueId: string;
  hostSecret?: string;
  userToken?: string;
  queueName?: string;
  expiresAt: string;
}

export class StorageService {
  private static readonly QUEUE_KEY_PREFIX = 'filap_queue_';
  private static readonly HOST_QUEUES_KEY = 'filap_host_queues';

  /**
   * Store queue data (host secret and/or user token)
   */
  static storeQueueData(queueId: string, data: Partial<StoredQueueData>): void {
    const key = this.QUEUE_KEY_PREFIX + queueId;
    const existing = this.getQueueData(queueId);
    
    const queueData: StoredQueueData = {
      queueId,
      hostSecret: data.hostSecret || existing?.hostSecret,
      userToken: data.userToken || existing?.userToken,
      queueName: data.queueName || existing?.queueName,
      expiresAt: data.expiresAt || existing?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    localStorage.setItem(key, JSON.stringify(queueData));

    // If this is a host queue, add to host queues list
    if (data.hostSecret) {
      this.addToHostQueues(queueId, queueData.queueName);
    }
  }

  /**
   * Get stored queue data (returns null if expired)
   */
  static getQueueData(queueId: string): StoredQueueData | null {
    const key = this.QUEUE_KEY_PREFIX + queueId;
    const data = localStorage.getItem(key);
    
    if (!data) return null;

    try {
      const parsed: StoredQueueData = JSON.parse(data);
      
      // Check if expired (24 hours)
      if (new Date(parsed.expiresAt) <= new Date()) {
        this.removeQueueData(queueId);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error parsing stored queue data:', error);
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Remove queue data
   */
  static removeQueueData(queueId: string): void {
    const key = this.QUEUE_KEY_PREFIX + queueId;
    localStorage.removeItem(key);
    this.removeFromHostQueues(queueId);
  }

  /**
   * Get host secret for a queue
   */
  static getHostSecret(queueId: string): string | null {
    const data = this.getQueueData(queueId);
    return data?.hostSecret || null;
  }

  /**
   * Get user token for a queue
   */
  static getUserToken(queueId: string): string | null {
    const data = this.getQueueData(queueId);
    return data?.userToken || null;
  }

  /**
   * Set user token for a queue
   */
  static setUserToken(queueId: string, userToken: string): void {
    this.storeQueueData(queueId, { userToken });
  }

  /**
   * Check if user is host of a queue
   */
  static isHost(queueId: string): boolean {
    return !!this.getHostSecret(queueId);
  }

  /**
   * Add queue to host queues list
   */
  private static addToHostQueues(queueId: string, queueName?: string): void {
    const hostQueues = this.getHostQueues();
    const existing = hostQueues.find(q => q.queueId === queueId);
    
    if (!existing) {
      hostQueues.push({
        queueId,
        queueName: queueName || queueId,
        createdAt: new Date().toISOString()
      });
      
      localStorage.setItem(this.HOST_QUEUES_KEY, JSON.stringify(hostQueues));
    }
  }

  /**
   * Remove queue from host queues list
   */
  private static removeFromHostQueues(queueId: string): void {
    const hostQueues = this.getHostQueues();
    const filtered = hostQueues.filter(q => q.queueId !== queueId);
    
    if (filtered.length !== hostQueues.length) {
      localStorage.setItem(this.HOST_QUEUES_KEY, JSON.stringify(filtered));
    }
  }

  /**
   * Get list of queues that user hosts
   */
  static getHostQueues(): Array<{ queueId: string; queueName: string; createdAt: string }> {
    const data = localStorage.getItem(this.HOST_QUEUES_KEY);
    
    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing host queues:', error);
      localStorage.removeItem(this.HOST_QUEUES_KEY);
      return [];
    }
  }

  /**
   * Clean up expired queue data (call this on app start)
   */
  static cleanupExpiredData(): void {
    const now = new Date();
    
    // Check all localStorage keys that start with our prefix
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.QUEUE_KEY_PREFIX)) {
        const queueId = key.replace(this.QUEUE_KEY_PREFIX, '');
        const data = localStorage.getItem(key);
        
        if (data) {
          try {
            const parsed: StoredQueueData = JSON.parse(data);
            if (new Date(parsed.expiresAt) <= now) {
              this.removeQueueData(queueId);
            }
          } catch {
            // Remove corrupted data
            localStorage.removeItem(key);
          }
        }
      }
    }
  }
}