import { RealTimeEventsService } from '../api';

export interface SSEEvent {
  event: 'new_message' | 'message_updated' | 'message_deleted' | 'queue_updated';
  data: any;
}

export type SSEEventHandler = (event: SSEEvent) => void;

export class RealtimeService {
  private static eventSources: Map<string, EventSource> = new Map();

  /**
   * Connect to SSE stream for real-time updates
   */
  static connectToQueue(queueId: string, onEvent: SSEEventHandler): EventSource {
    // Close existing connection if any
    this.disconnectFromQueue(queueId);

    // Create new EventSource connection
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/queues/${queueId}/events`;
    const eventSource = new EventSource(url);

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent({
          event: data.event || 'message',
          data: data.data || data
        });
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    // Store the event source
    this.eventSources.set(queueId, eventSource);

    return eventSource;
  }

  /**
   * Disconnect from SSE stream
   */
  static disconnectFromQueue(queueId: string): void {
    const eventSource = this.eventSources.get(queueId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(queueId);
    }
  }

  /**
   * Disconnect from all SSE streams
   */
  static disconnectAll(): void {
    this.eventSources.forEach((eventSource) => {
      eventSource.close();
    });
    this.eventSources.clear();
  }

  /**
   * Check if connected to a queue
   */
  static isConnected(queueId: string): boolean {
    const eventSource = this.eventSources.get(queueId);
    return eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Get connection state for a queue
   */
  static getConnectionState(queueId: string): number | null {
    const eventSource = this.eventSources.get(queueId);
    return eventSource?.readyState ?? null;
  }
}