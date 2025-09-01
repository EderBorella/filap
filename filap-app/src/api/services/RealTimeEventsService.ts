/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class RealTimeEventsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Server-Sent Events endpoint for real-time updates
     * @param queueId Queue identifier
     * @returns string SSE stream for real-time updates
     * @throws ApiError
     */
    public getApiQueuesEvents(
        queueId: string,
    ): CancelablePromise<string> {
        return this.httpRequest.request({
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
