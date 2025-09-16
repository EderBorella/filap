import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { HandRaisesService } from '../../api/services/HandRaisesService';
import { StorageService } from '../../services';
import { useToast } from '../Toast';
import './HandRaiseList.scss';

interface HandRaise {
  id: string;
  user_name: string;
  user_token: string;
  raised_at: string;
  completed: boolean;
  completed_at?: string;
}

interface HandRaiseData {
  active_hand_raises: HandRaise[];
  completed_hand_raises: HandRaise[];
  total_active: number;
  total_completed: number;
}

export interface HandRaiseListProps {
  queueId: string;
  onHandRaiseUpdate?: (data: HandRaiseData) => void;
}

const HandRaiseList: React.FC<HandRaiseListProps> = ({
  queueId,
  onHandRaiseUpdate
}) => {
  const { t } = useTranslation();
  const [handRaises, setHandRaises] = useState<HandRaiseData>({
    active_hand_raises: [],
    completed_hand_raises: [],
    total_active: 0,
    total_completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { showError } = useToast();

  // Check if user is host
  const isHost = StorageService.isHost(queueId);

  // Fetch hand raises from API
  const fetchHandRaises = useCallback(async () => {
    try {
      const data = await HandRaisesService.getApiQueuesHandraises(queueId, isHost);
      setHandRaises(data);
      onHandRaiseUpdate?.(data);
    } catch (error) {
      console.error('Error fetching hand raises:', error);
      showError(t('toast.errors.fetchHandRaisesFailed'));
    } finally {
      setLoading(false);
    }
  }, [queueId, isHost, showError, onHandRaiseUpdate]);

  // Handle real-time updates via SSE
  const setupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/queues/${queueId}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      console.log('SSE connected for hand raises');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSSEEvent(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setConnected(false);

      // Reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          setupSSE();
        }
      }, 3000);
    };
  }, [queueId]);

  // Handle SSE events
  const handleSSEEvent = useCallback((data: any) => {
    switch (data.event) {
      case 'hand_raise_new':
        setHandRaises(prev => {
          const newData = {
            ...prev,
            active_hand_raises: [...prev.active_hand_raises, data.data],
            total_active: prev.total_active + 1
          };
          onHandRaiseUpdate?.(newData);
          return newData;
        });
        break;

      case 'hand_raise_updated':
        setHandRaises(prev => {
          const updatedHandRaise = data.data;
          let newActive = [...prev.active_hand_raises];
          let newCompleted = [...prev.completed_hand_raises];

          // Remove from active if completed
          if (updatedHandRaise.completed) {
            newActive = newActive.filter(hr => hr.id !== updatedHandRaise.id);
            // Add to completed if not already there
            if (!newCompleted.find(hr => hr.id === updatedHandRaise.id)) {
              newCompleted.push(updatedHandRaise);
            }
          } else {
            // Remove from completed if uncompleted
            newCompleted = newCompleted.filter(hr => hr.id !== updatedHandRaise.id);
            // Add to active if not already there
            if (!newActive.find(hr => hr.id === updatedHandRaise.id)) {
              newActive.push(updatedHandRaise);
            }
          }

          const newData = {
            active_hand_raises: newActive,
            completed_hand_raises: newCompleted,
            total_active: newActive.length,
            total_completed: newCompleted.length
          };
          onHandRaiseUpdate?.(newData);
          return newData;
        });
        break;

      case 'hand_raise_removed':
        setHandRaises(prev => {
          const newData = {
            ...prev,
            active_hand_raises: prev.active_hand_raises.filter(hr => hr.id !== data.data.id),
            completed_hand_raises: prev.completed_hand_raises.filter(hr => hr.id !== data.data.id),
            total_active: prev.active_hand_raises.filter(hr => hr.id !== data.data.id).length,
            total_completed: prev.completed_hand_raises.filter(hr => hr.id !== data.data.id).length
          };
          onHandRaiseUpdate?.(newData);
          return newData;
        });
        break;
    }
  }, [onHandRaiseUpdate]);

  // Mark hand raise as completed (host only)
  const markAsCompleted = useCallback(async (handRaiseId: string) => {
    if (!isHost) return;

    try {
      const hostSecret = StorageService.getHostSecret(queueId);
      if (!hostSecret) {
        showError(t('toast.errors.hostAuthRequired'));
        return;
      }

      await HandRaisesService.patchApiQueuesHandraises(
        queueId,
        handRaiseId,
        hostSecret,
        { completed: true }
      );
    } catch (error) {
      console.error('Error marking hand raise as completed:', error);
      showError(t('toast.errors.markCompletedFailed'));
    }
  }, [isHost, queueId, showError]);

  // Setup on mount
  useEffect(() => {
    fetchHandRaises();
    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [fetchHandRaises, setupSSE]);

  // Loading state
  if (loading) {
    return (
      <div className="hand-raise-list hand-raise-list--loading">
        <div className="hand-raise-list__loading">
          <div className="hand-raise-list__loading-spinner" />
          <p className="hand-raise-list__loading-text">{t('handRaise.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hand-raise-list">
      {/* Connection status */}
      <div className={`hand-raise-list__status ${connected ? 'hand-raise-list__status--connected' : 'hand-raise-list__status--disconnected'}`}>
        <span className="hand-raise-list__status-indicator" />
        <span className="hand-raise-list__status-text">
          {connected ? t('handRaise.connected') : t('handRaise.connecting')}
        </span>
      </div>

      {/* Active hand raises */}
      <div className="hand-raise-list__section">
        <h3 className="hand-raise-list__section-title">
          {t('handRaise.activeRaises')} ({handRaises.total_active})
        </h3>

        {handRaises.active_hand_raises.length === 0 ? (
          <div className="hand-raise-list__empty">
            <div className="hand-raise-list__empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12-4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                <path d="M20 2H4c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 15H4V4h16v13z"/>
              </svg>
            </div>
            <p className="hand-raise-list__empty-text">
              {t('handRaise.noActiveRaises')}
            </p>
          </div>
        ) : (
          <div className="hand-raise-list__items">
            {handRaises.active_hand_raises.map((handRaise, index) => (
              <div key={handRaise.id} className="hand-raise-item">
                <div className="hand-raise-item__position">
                  #{index + 1}
                </div>
                <div className="hand-raise-item__content">
                  <div className="hand-raise-item__name">
                    {handRaise.user_name}
                  </div>
                  <div className="hand-raise-item__time">
                    {new Date(handRaise.raised_at).toLocaleTimeString()}
                  </div>
                </div>
                {isHost && (
                  <div className="hand-raise-item__actions">
                    <button
                      className="btn btn--small btn--success"
                      onClick={() => markAsCompleted(handRaise.id)}
                      title={t('handRaise.markCompleted')}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('handRaise.complete')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed hand raises (host only) */}
      {isHost && handRaises.completed_hand_raises.length > 0 && (
        <div className="hand-raise-list__section">
          <h3 className="hand-raise-list__section-title">
            {t('handRaise.completedRaises')} ({handRaises.total_completed})
          </h3>
          <div className="hand-raise-list__items hand-raise-list__items--completed">
            {handRaises.completed_hand_raises.map((handRaise) => (
              <div key={handRaise.id} className="hand-raise-item hand-raise-item--completed">
                <div className="hand-raise-item__content">
                  <div className="hand-raise-item__name">
                    {handRaise.user_name}
                  </div>
                  <div className="hand-raise-item__time">
                    {t('handRaise.completedAt')} {handRaise.completed_at ? new Date(handRaise.completed_at).toLocaleTimeString() : ''}
                  </div>
                </div>
                <div className="hand-raise-item__status">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HandRaiseList;