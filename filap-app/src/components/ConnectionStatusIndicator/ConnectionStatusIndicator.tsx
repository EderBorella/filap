import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './ConnectionStatusIndicator.scss';

export interface ConnectionStatusIndicatorProps {
  queueId: string;
  connectedText?: string;
  disconnectedText?: string;
  className?: string;
  onConnectionChange?: (connected: boolean) => void;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  queueId,
  connectedText,
  disconnectedText,
  className = '',
  onConnectionChange
}) => {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const defaultConnectedText = connectedText || t('queue.liveUpdatesActive');
  const defaultDisconnectedText = disconnectedText || t('queue.reconnecting');

  // Setup SSE connection
  const setupSSEConnection = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const eventSource = new EventSource(`${apiUrl}/api/queues/${queueId}/events`);

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setConnected(true);
      onConnectionChange?.(true);
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'connected') {
          setConnected(true);
          onConnectionChange?.(true);
        }
      } catch (error) {
        // Ignore non-JSON heartbeat messages
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setConnected(false);
      onConnectionChange?.(false);

      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect SSE...');
        setupSSEConnection();
      }, 3000);
    };

    eventSourceRef.current = eventSource;
  }, [queueId, onConnectionChange]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Effect for managing the SSE connection
  useEffect(() => {
    setupSSEConnection();
    return cleanup;
  }, [setupSSEConnection, cleanup]);

  return (
    <div
      className={`connection-status ${connected ? 'connection-status--connected' : 'connection-status--disconnected'} ${className}`}
    >
      <div className="connection-status__indicator" />
      <span className="connection-status__text">
        {connected ? defaultConnectedText : defaultDisconnectedText}
      </span>
    </div>
  );
};

export default ConnectionStatusIndicator;