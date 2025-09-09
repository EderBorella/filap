import { messagesService, votingService } from './apiConfig';
import { StorageService } from './storageService';
import type { CancelablePromise } from '../api';

export interface MessageResponse {
  id: string;
  queue_id: string;
  text: string;
  author_name?: string;
  user_token: string;
  vote_count: number;
  is_read: boolean;
  has_user_voted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMessageRequest {
  text: string;
  author_name?: string;
  user_token: string;
}

export interface UpdateMessageRequest {
  is_read: boolean;
}

export interface MessagesListResponse {
  messages: MessageResponse[];
  total_count: number;
  limit: number;
  offset: number;
  sort_by: string;
}

export interface GetMessagesOptions {
  sort?: 'votes' | 'newest';
  limit?: number;
  offset?: number;
}

export class MessageService {
  /**
   * Get messages for a queue with pagination and sorting
   */
  static async getMessages(
    queueId: string, 
    options: GetMessagesOptions = {}
  ): Promise<MessagesListResponse> {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const params = new URLSearchParams({
      ...(options.sort && { sort: options.sort }),
      limit: String(options.limit || 50),
      offset: String(options.offset || 0)
    });

    // Get user token from StorageService for vote status
    const userToken = StorageService.getUserToken(queueId);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (userToken) {
      headers['X-User-Token'] = userToken;
    }

    const response = await fetch(`${apiUrl}/api/queues/${queueId}/messages?${params}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Create a new message/question in a queue
   */
  static createMessage(
    queueId: string, 
    data: CreateMessageRequest
  ): CancelablePromise<MessageResponse> {
    return messagesService.postApiQueuesMessages(queueId, {
      text: data.text,
      author_name: data.author_name,
      user_token: data.user_token
    }) as CancelablePromise<MessageResponse>;
  }

  /**
   * Update a message (host or author can mark as read)
   */
  static updateMessage(
    queueId: string,
    messageId: string,
    data: UpdateMessageRequest,
    hostSecret?: string,
    userToken?: string
  ): CancelablePromise<MessageResponse> {
    return messagesService.patchApiQueuesMessages(
      queueId,
      messageId,
      data,
      hostSecret,
      userToken
    ) as CancelablePromise<MessageResponse>;
  }

  /**
   * Delete a message (host only)
   */
  static deleteMessage(
    queueId: string,
    messageId: string,
    hostSecret: string
  ): CancelablePromise<void> {
    return messagesService.deleteApiQueuesMessages(
      queueId,
      messageId,
      hostSecret
    );
  }

  /**
   * Upvote a message
   */
  static upvoteMessage(
    messageId: string,
    userToken: string
  ): CancelablePromise<MessageResponse> {
    return votingService.postApiMessagesUpvote(messageId, userToken) as CancelablePromise<MessageResponse>;
  }
}