/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class UserTokensService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Generate a user token for a queue
     * @param queueId Queue identifier
     * @returns any User token generated successfully
     * @throws ApiError
     */
    public postApiQueuesUserToken(
        queueId: string,
    ): CancelablePromise<{
        /**
         * Token expiration time
         */
        expires_at?: string;
        /**
         * Queue identifier
         */
        queue_id?: string;
        /**
         * Generated user token
         */
        user_token?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/queues/{queue_id}/user-token',
            path: {
                'queue_id': queueId,
            },
            errors: {
                404: `Queue not found or expired`,
                500: `Internal server error`,
            },
        });
    }
}
