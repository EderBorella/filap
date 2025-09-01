import { FilapAPI } from '../api';
import { API_BASE_URL } from '../config';

// Create and configure the FilapAPI client instance
export const apiClient = new FilapAPI({
  BASE: API_BASE_URL,
  WITH_CREDENTIALS: false,
  HEADERS: {
    'Content-Type': 'application/json',
  },
});

// Export individual services for convenience
export const queuesService = apiClient.queues;
export const messagesService = apiClient.messages;
export const userTokensService = apiClient.userTokens;
export const votingService = apiClient.voting;
export const realTimeEventsService = apiClient.realTimeEvents;