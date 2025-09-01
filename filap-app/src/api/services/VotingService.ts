/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class VotingService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Cast an upvote for a message
     * @param messageId Message identifier
     * @param xUserToken User token for vote tracking
     * @returns any Upvote cast successfully
     * @throws ApiError
     */
    public postApiMessagesUpvote(
        messageId: string,
        xUserToken: string,
    ): CancelablePromise<{
        author_name?: string;
        created_at?: string;
        id?: string;
        is_read?: boolean;
        queue_id?: string;
        text?: string;
        updated_at?: string;
        user_token?: string;
        /**
         * Updated vote count
         */
        vote_count?: number;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/messages/{message_id}/upvote',
            path: {
                'message_id': messageId,
            },
            headers: {
                'X-User-Token': xUserToken,
            },
            errors: {
                400: `User token required`,
                404: `Message not found or already voted`,
                500: `Internal server error`,
            },
        });
    }
}
