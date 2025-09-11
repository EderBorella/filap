import { QueuesService, UserTokensService } from '../api';
import type { CancelablePromise } from '../api';

export interface CreateQueueRequest {
  name?: string;
  default_sort_order?: 'votes' | 'newest';
}

// Use the exact OpenAPI generated types
export type QueueResponse = {
  created_at?: string;
  default_sort_order?: 'votes' | 'newest';
  expires_at?: string;
  host_secret?: string;
  id?: string;
  name?: string;
};

export type QueueMetadata = {
  default_sort_order?: 'votes' | 'newest';
  expires_at?: string;
  id?: string;
  name?: string;
};

export interface UpdateQueueRequest {
  name?: string;
  default_sort_order?: 'votes' | 'newest';
}

export interface UserTokenResponse {
  user_token?: string;
  queue_id?: string;
  expires_at?: string;
}

export class QueueService {
  /**
   * Create a new queue
   */
  static createQueue(data: CreateQueueRequest = {}): CancelablePromise<QueueResponse> {
    return QueuesService.postApiQueues({
      name: data.name,
      default_sort_order: data.default_sort_order || 'votes'
    });
  }

  /**
   * Get queue metadata
   */
  static getQueueMetadata(queueId: string): CancelablePromise<QueueMetadata> {
    return QueuesService.getApiQueues(queueId);
  }

  /**
   * Get queue metadata (alias for consistency)
   */
  static getQueue(queueId: string): CancelablePromise<QueueMetadata> {
    return QueuesService.getApiQueues(queueId);
  }

  /**
   * Update queue settings (host only)
   */
  static updateQueue(
    queueId: string, 
    data: UpdateQueueRequest,
    hostSecret: string
  ): CancelablePromise<QueueMetadata> {
    return QueuesService.patchApiQueues(queueId, hostSecret, data);
  }

  /**
   * Generate a user token for a queue
   */
  static generateUserToken(queueId: string): CancelablePromise<UserTokenResponse> {
    return UserTokensService.postApiQueuesUserToken(queueId);
  }

  /**
   * Validate if a string is a valid UUID
   */
  static isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}