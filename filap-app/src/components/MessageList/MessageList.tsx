import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageService } from '../../services';
import { StorageService } from '../../services';
import MessageCard from '../MessageCard';
import { useToast } from '../Toast';
import type { SortOption } from '../QueueHeader';
import './MessageList.scss';

interface Message {
  id: string;
  text: string;
  author_name?: string;
  vote_count: number;
  is_read: boolean;
  created_at: string;
  has_user_voted: boolean;
}

interface QueueUpdateData {
  default_sort_order: SortOption;
  name?: string;
}

export interface MessageListProps {
  queueId: string;
  currentSort: SortOption;
  onQueueUpdate: (data: QueueUpdateData) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  queueId,
  currentSort,
  onQueueUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showError } = useToast();

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  // Sort messages based on current sort option
  const sortMessages = useCallback((messageList: Message[]) => {
    const sorted = [...messageList];
    if (currentSort === 'votes') {
      return sorted.sort((a, b) => b.vote_count - a.vote_count);
    } else {
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [currentSort]);

  // Create a ref to hold the latest sortMessages function. This prevents
  // our SSE event listeners from becoming stale when the sort order changes.
  const sortMessagesRef = useRef(sortMessages);
  useEffect(() => {
    sortMessagesRef.current = sortMessages;
  }, [sortMessages]);

  // Initial data fetch
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await MessageService.getMessages(queueId, {
        sort: currentSort,
        limit: 50,
        offset: 0
      });
      
      // Extract messages array from response and normalize data
      const messageList = (response.messages || []).map((msg: any) => ({
        id: msg.id,
        text: msg.text,
        author_name: msg.author_name,
        vote_count: msg.vote_count || 0,
        is_read: msg.is_read || false,
        created_at: msg.created_at,
        has_user_voted: msg.has_user_voted || false, // Default to false if not provided
      }));
      const sortedMessages = sortMessages(messageList);
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showError('Failed to load messages. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [queueId, currentSort, showError, sortMessages]);

  // --- SSE Event Handlers ---
  const handleNewMessage = useCallback((event: MessageEvent) => {
    try {
      const newMessage = JSON.parse(event.data);
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMessage.id)) return prev;
        const updated = sortMessagesRef.current([...prev, newMessage]);
        setTimeout(scrollToBottom, 100);
        return updated;
      });
    } catch (e) {
      console.error("Failed to parse new_message event", e);
    }
  }, [scrollToBottom]);

  const handleMessageUpdated = useCallback((event: MessageEvent) => {
    try {
      const updatedData = JSON.parse(event.data);
      setMessages(prev => 
        sortMessagesRef.current(prev.map(msg => msg.id === updatedData.id ? { ...msg, ...updatedData } : msg))
      );
    } catch (e) {
      console.error("Failed to parse message_updated event", e);
    }
  }, []);

  const handleMessageDeleted = useCallback((event: MessageEvent) => {
    try {
      const { id: deletedId } = JSON.parse(event.data);
      setMessages(prev => sortMessagesRef.current(prev.filter(msg => msg.id !== deletedId)));
    } catch (e) {
      console.error("Failed to parse message_deleted event", e);
    }
  }, []);

  const handleQueueUpdated = useCallback((event: MessageEvent) => {
    try {
      const updatedData = JSON.parse(event.data);
      if (updatedData.default_sort_order) {
        onQueueUpdate(updatedData);
      }
    } catch (e) {
      console.error("Failed to parse queue_updated event", e);
    }
  }, [onQueueUpdate]);

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
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'connected') {
          setConnected(true);
        }
      } catch (error) {
        // Ignore non-JSON heartbeat messages
      }
    };

    // Add specific listeners for custom events
    eventSource.addEventListener('new_message', handleNewMessage);
    eventSource.addEventListener('message_updated', handleMessageUpdated);
    eventSource.addEventListener('message_deleted', handleMessageDeleted);
    eventSource.addEventListener('queue_updated', handleQueueUpdated);

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setConnected(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect SSE...');
        setupSSEConnection();
      }, 3000);
    };

    eventSourceRef.current = eventSource;
  }, [queueId, handleNewMessage, handleMessageUpdated, handleMessageDeleted, handleQueueUpdated]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Effect for fetching messages when queueId or sort order changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Effect for managing the SSE connection, only runs when queueId changes
  useEffect(() => {
    setupSSEConnection();
    return cleanup;
  }, [queueId, setupSSEConnection, cleanup]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  if (loading) {
    return (
      <div className="message-list message-list--loading">
        <div className="message-list__skeleton">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="message-list__skeleton-item">
              <div className="message-list__skeleton-voting" />
              <div className="message-list__skeleton-content">
                <div className="message-list__skeleton-text" />
                <div className="message-list__skeleton-text message-list__skeleton-text--short" />
                <div className="message-list__skeleton-metadata" />
              </div>
              <div className="message-list__skeleton-actions" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="message-list" ref={containerRef}>
      {/* Connection Status Indicator */}
      <div className={`message-list__status ${connected ? 'message-list__status--connected' : 'message-list__status--disconnected'}`}>
        <div className="message-list__status-indicator" />
        <span className="message-list__status-text">
          {connected ? 'Live updates active' : 'Reconnecting...'}
        </span>
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="message-list__empty">
          <div className="message-list__empty-icon">
            <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="message-list__empty-title">No questions yet</h3>
          <p className="message-list__empty-subtitle">Be the first to ask!</p>
        </div>
      ) : (
        <div className="message-list__content">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`message-list__item ${index === messages.length - 1 ? 'message-list__item--last' : ''}`}
            >
              <MessageCard
                id={message.id}
                queueId={queueId}
                text={message.text}
                authorName={message.author_name}
                voteCount={message.vote_count}
                isRead={message.is_read}
                createdAt={message.created_at}
                hasUserVoted={message.has_user_voted}
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;