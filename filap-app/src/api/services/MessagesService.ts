/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MessagesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Retrieve messages for a queue with pagination and sorting
     * @param queueId Queue identifier
     * @param sort Sort order (overrides queue default)
     * @param limit Number of messages to return
     * @param offset Number of messages to skip for pagination
     * @returns any Messages retrieved successfully
     * @throws ApiError
     */
    public getApiQueuesMessages(
        queueId: string,
        sort?: 'votes' | 'newest',
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<{
        /**
         * Applied limit
         */
        limit?: number;
        messages?: Array<{
            author_name?: string;
            created_at?: string;
            id?: string;
            is_read?: boolean;
            queue_id?: string;
            text?: string;
            updated_at?: string;
            user_token?: string;
            vote_count?: number;
        }>;
        /**
         * Applied offset
         */
        offset?: number;
        /**
         * Applied sort order
         */
        sort_by?: string;
        /**
         * Total number of messages in queue
         */
        total_count?: number;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/queues/{queue_id}/messages',
            path: {
                'queue_id': queueId,
            },
            query: {
                'sort': sort,
                'limit': limit,
                'offset': offset,
            },
            errors: {
                400: `Invalid query parameters`,
                404: `Queue not found or expired`,
            },
        });
    }
    /**
     * Submit a new question/message to a queue
     * @param queueId Queue identifier
     * @param body
     * @returns any Message created successfully
     * @throws ApiError
     */
    public postApiQueuesMessages(
        queueId: string,
        body: {
            /**
             * Optional author name (max 100 characters)
             */
            author_name?: string;
            /**
             * Message content (1-2000 characters)
             */
            text: string;
            /**
             * User token for identification
             */
            user_token: string;
        },
    ): CancelablePromise<{
        author_name?: string;
        created_at?: string;
        id?: string;
        is_read?: boolean;
        queue_id?: string;
        text?: string;
        updated_at?: string;
        user_token?: string;
        vote_count?: number;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/queues/{queue_id}/messages',
            path: {
                'queue_id': queueId,
            },
            body: body,
            errors: {
                400: `Invalid request data`,
                404: `Queue not found or expired`,
            },
        });
    }
    /**
     * Delete a message (host only)
     * @param queueId Queue identifier
     * @param messageId Message identifier
     * @param xQueueSecret Host authentication secret
     * @returns void
     * @throws ApiError
     */
    public deleteApiQueuesMessages(
        queueId: string,
        messageId: string,
        xQueueSecret: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/queues/{queue_id}/messages/{message_id}',
            path: {
                'queue_id': queueId,
                'message_id': messageId,
            },
            headers: {
                'X-Queue-Secret': xQueueSecret,
            },
            errors: {
                401: `Host authentication required`,
                404: `Unauthorized or message not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Update a message (host or author)
     * @param queueId Queue identifier
     * @param messageId Message identifier
     * @param body
     * @param xQueueSecret Host authentication secret (for host access)
     * @param xUserToken User token (for author access)
     * @returns any Message updated successfully
     * @throws ApiError
     */
    public patchApiQueuesMessages(
        queueId: string,
        messageId: string,
        body: {
            /**
             * Mark message as read/unread
             */
            is_read?: boolean;
        },
        xQueueSecret?: string,
        xUserToken?: string,
    ): CancelablePromise<{
        author_name?: string;
        created_at?: string;
        id?: string;
        is_read?: boolean;
        queue_id?: string;
        text?: string;
        updated_at?: string;
        user_token?: string;
        vote_count?: number;
    }> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/queues/{queue_id}/messages/{message_id}',
            path: {
                'queue_id': queueId,
                'message_id': messageId,
            },
            headers: {
                'X-Queue-Secret': xQueueSecret,
                'X-User-Token': xUserToken,
            },
            body: body,
            errors: {
                400: `Invalid request data`,
                401: `Authentication required`,
                404: `Unauthorized or message not found`,
            },
        });
    }
}
