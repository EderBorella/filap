/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VotingService {
    /**
     * Toggle upvote for a message (add vote if not voted, remove if already voted)
     * @param messageId Message identifier
     * @param xUserToken User token for vote tracking
     * @returns any Vote toggled successfully
     * @throws ApiError
     */
    public static postApiMessagesUpvote(
        messageId: string,
        xUserToken: string,
    ): CancelablePromise<{
        author_name?: string;
        created_at?: string;
        /**
         * Whether the current user has voted for this message
         */
        has_user_voted?: boolean;
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
        return __request(OpenAPI, {
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
                404: `Message not found`,
                500: `Internal server error`,
            },
        });
    }
}
