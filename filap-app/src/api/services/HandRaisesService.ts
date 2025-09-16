/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HandRaisesService {
    /**
     * Raise or lower a hand for a user in a queue
     * @param queueId Queue identifier
     * @param body
     * @returns any Hand lowered successfully (empty response)
     * @throws ApiError
     */
    public static postApiQueuesHandraise(
        queueId: string,
        body: {
            /**
             * User's display name (1-100 characters)
             */
            user_name: string;
            /**
             * User token for identification
             */
            user_token: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/queues/{queue_id}/handraise',
            path: {
                'queue_id': queueId,
            },
            body: body,
            errors: {
                400: `Bad request (invalid input)`,
                404: `Queue not found or expired`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get all hand raises for a queue
     * @param queueId Queue identifier
     * @param includeCompleted Whether to include completed hand raises
     * @returns any Hand raises retrieved successfully
     * @throws ApiError
     */
    public static getApiQueuesHandraises(
        queueId: string,
        includeCompleted: boolean = false,
    ): CancelablePromise<{
        active_hand_raises?: Array<{
            completed?: boolean;
            completed_at?: string;
            id?: string;
            queue_id?: string;
            raised_at?: string;
            user_name?: string;
            user_token?: string;
        }>;
        completed_hand_raises?: Array<any>;
        total_active?: number;
        total_completed?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/queues/{queue_id}/handraises',
            path: {
                'queue_id': queueId,
            },
            query: {
                'include_completed': includeCompleted,
            },
            errors: {
                404: `Queue not found or expired`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Update a hand raise (host only)
     * @param queueId Queue identifier
     * @param handRaiseId Hand raise identifier
     * @param xQueueSecret Host authentication secret
     * @param body
     * @returns any Hand raise updated successfully
     * @throws ApiError
     */
    public static patchApiQueuesHandraises(
        queueId: string,
        handRaiseId: string,
        xQueueSecret: string,
        body: {
            /**
             * Mark hand raise as completed/uncompleted
             */
            completed?: boolean;
        },
    ): CancelablePromise<{
        completed?: boolean;
        completed_at?: string;
        id?: string;
        queue_id?: string;
        raised_at?: string;
        user_name?: string;
        user_token?: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/queues/{queue_id}/handraises/{hand_raise_id}',
            path: {
                'queue_id': queueId,
                'hand_raise_id': handRaiseId,
            },
            headers: {
                'X-Queue-Secret': xQueueSecret,
            },
            body: body,
            errors: {
                400: `Bad request`,
                401: `Unauthorized (invalid host secret)`,
                404: `Queue or hand raise not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get the position of a user in the hand raise queue
     * @param queueId Queue identifier
     * @param userToken User token for identification
     * @returns any User position retrieved successfully
     * @throws ApiError
     */
    public static getApiQueuesUserPosition(
        queueId: string,
        userToken: string,
    ): CancelablePromise<{
        /**
         * Whether user has an active hand raise
         */
        has_raised_hand?: boolean;
        /**
         * User's position in queue (1-based), null if not in queue
         */
        position?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/queues/{queue_id}/user-position',
            path: {
                'queue_id': queueId,
            },
            query: {
                'user_token': userToken,
            },
            errors: {
                400: `Bad request (missing user_token)`,
                404: `Queue not found`,
                500: `Internal server error`,
            },
        });
    }
}
