import { 
  MessagesService,
  QueuesService,
  UserTokensService,
  VotingService,
  RealTimeEventsService,
  OpenAPI
} from '../api';
import { API_BASE_URL } from '../config';

// Configure OpenAPI settings
OpenAPI.BASE = API_BASE_URL;
OpenAPI.WITH_CREDENTIALS = false;
OpenAPI.HEADERS = {
  'Content-Type': 'application/json',
};

// Export individual services for convenience
export const queuesService = QueuesService;
export const messagesService = MessagesService;
export const userTokensService = UserTokensService;
export const votingService = VotingService;
export const realTimeEventsService = RealTimeEventsService;