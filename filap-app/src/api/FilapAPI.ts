/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { MessagesService } from './services/MessagesService';
import { QueuesService } from './services/QueuesService';
import { RealTimeEventsService } from './services/RealTimeEventsService';
import { UserTokensService } from './services/UserTokensService';
import { VotingService } from './services/VotingService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class FilapAPI {
    public readonly messages: MessagesService;
    public readonly queues: QueuesService;
    public readonly realTimeEvents: RealTimeEventsService;
    public readonly userTokens: UserTokensService;
    public readonly voting: VotingService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'),
            VERSION: config?.VERSION ?? '1.0.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.messages = new MessagesService(this.request);
        this.queues = new QueuesService(this.request);
        this.realTimeEvents = new RealTimeEventsService(this.request);
        this.userTokens = new UserTokensService(this.request);
        this.voting = new VotingService(this.request);
    }
}

