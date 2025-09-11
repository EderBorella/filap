/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RealTimeEventsService {
    /**
     * Server-Sent Events endpoint for real-time updates
     * @param queueId Queue identifier
     * @returns string SSE stream for real-time updates
     * @throws ApiError
     */
    public static getApiQueuesEvents(
        queueId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/queues/{queue_id}/events',
            path: {
                'queue_id': queueId,
            },
            errors: {
                404: `Queue not found or expired`,
            },
        });
    }
}
