/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class QueuesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Create a new queue
     * @param body
     * @returns any Queue created successfully
     * @throws ApiError
     */
    public postApiQueues(
        body?: {
            /**
             * Default sorting order for messages
             */
            default_sort_order?: 'votes' | 'newest';
            /**
             * Optional queue name
             */
            name?: string;
        },
    ): CancelablePromise<{
        created_at?: string;
        default_sort_order?: string;
        expires_at?: string;
        /**
         * Host authentication secret
         */
        host_secret?: string;
        /**
         * Unique queue identifier
         */
        id?: string;
        /**
         * Queue name
         */
        name?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/queues',
            body: body,
            errors: {
                400: `Invalid request data`,
            },
        });
    }
    /**
     * Get queue metadata and settings
     * @param queueId Queue identifier
     * @returns any Queue metadata
     * @throws ApiError
     */
    public getApiQueues(
        queueId: string,
    ): CancelablePromise<{
        /**
         * Default sorting order
         */
        default_sort_order?: 'votes' | 'newest';
        /**
         * Queue expiration time
         */
        expires_at?: string;
        /**
         * Queue identifier
         */
        id?: string;
        /**
         * Queue name
         */
        name?: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/queues/{queue_id}',
            path: {
                'queue_id': queueId,
            },
            errors: {
                404: `Queue not found or expired`,
            },
        });
    }
    /**
     * Update queue settings (host only)
     * @param queueId Queue identifier
     * @param xQueueSecret Host authentication secret
     * @param body
     * @returns any Queue updated successfully
     * @throws ApiError
     */
    public patchApiQueues(
        queueId: string,
        xQueueSecret: string,
        body?: {
            /**
             * Default sorting order for messages
             */
            default_sort_order?: 'votes' | 'newest';
            /**
             * Updated queue name
             */
            name?: string;
        },
    ): CancelablePromise<{
        default_sort_order?: string;
        expires_at?: string;
        id?: string;
        name?: string;
    }> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/queues/{queue_id}',
            path: {
                'queue_id': queueId,
            },
            headers: {
                'X-Queue-Secret': xQueueSecret,
            },
            body: body,
            errors: {
                400: `Invalid request data`,
                401: `Missing host secret`,
                403: `Invalid host credentials`,
                404: `Queue not found`,
            },
        });
    }
}
