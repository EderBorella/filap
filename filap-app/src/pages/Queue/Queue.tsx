import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QueueService } from '../../services';
import { StorageService } from '../../services';
import { useToast } from '../../components/Toast';
import QueueHeader, { type SortOption } from '../../components/QueueHeader';
import MessageList from '../../components/MessageList';
import MessageInput from '../../components/MessageInput';
import './Queue.scss';

interface QueueData {
  id?: string;
  name?: string;
  expires_at?: string;
  default_sort_order?: SortOption;
}

const Queue: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSort, setCurrentSort] = useState<SortOption>('votes');
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess, showInfo } = useToast();

  // Fetch queue data
  const fetchQueueData = useCallback(async () => {
    if (!queueId) {
      setError('Queue ID is required');
      setLoading(false);
      return;
    }

    try {
      const data = await QueueService.getQueue(queueId);
      setQueueData(data);
      setCurrentSort(data.default_sort_order || 'votes');
      setError(null);
    } catch (error) {
      console.error('Error fetching queue:', error);
      setError('Queue not found or expired');
      showError('Queue not found or expired. Please check your link.');
    } finally {
      setLoading(false);
    }
  }, [queueId, showError]);

  // Handle sort change (host only)
  const handleSortChange = useCallback(async (newSort: SortOption) => {
    if (!queueData || !queueId) return;

    const isHost = StorageService.isHost(queueId);
    if (!isHost) {
      showError('Only the host can change sort order.');
      return;
    }

    try {
      const hostSecret = StorageService.getHostSecret(queueId);
      if (!hostSecret) {
        showError('Host authentication required.');
        return;
      }

      // Update queue sort order on backend
      await QueueService.updateQueue(queueId, {
        default_sort_order: newSort
      }, hostSecret);

      // Update local state
      setCurrentSort(newSort);
      setQueueData(prev => prev ? { ...prev, default_sort_order: newSort } : null);
      
      showSuccess(`Sort order changed to ${newSort === 'votes' ? 'Most Votes' : 'Newest'}`);
    } catch (error) {
      console.error('Error updating sort order:', error);
      showError('Failed to update sort order. Please try again.');
    }
  }, [queueData, queueId, showError, showSuccess]);

  // Handle real-time queue updates from SSE
  const handleQueueUpdate = useCallback((updatedQueueData: Partial<QueueData>) => {
    let updated = false;
    if (updatedQueueData.default_sort_order && updatedQueueData.default_sort_order !== currentSort) {
        setCurrentSort(updatedQueueData.default_sort_order);
        showInfo(`Sort order updated by host to: ${updatedQueueData.default_sort_order === 'votes' ? 'Most Votes' : 'Newest'}`);
        updated = true;
    }
    if (updatedQueueData.name && updatedQueueData.name !== queueData?.name) {
        setQueueData(prev => prev ? { ...prev, name: updatedQueueData.name } : null);
        if (!updated) { // Avoid double toast
            showInfo(`Queue name updated by host.`);
        }
    }
  }, [currentSort, queueData?.name, showInfo]);

  // Setup user token on mount
  useEffect(() => {
    const setupUserToken = async () => {
      if (!queueId) return;

      try {
        // Check if user token already exists
        let userToken = StorageService.getUserToken(queueId);
        
        if (!userToken) {
          console.log('Generating user token...');
          // Generate new user token
          const response = await QueueService.generateUserToken(queueId);
          StorageService.setUserToken(queueId, response.user_token);
          console.log('User token generated and stored');
        } else {
          console.log('User token already exists');
        }
      } catch (error) {
        console.error('Error setting up user token:', error);
        // Only show error once and don't retry automatically
        showError('Failed to setup user session. Please check if the backend is running.');
      }
    };

    setupUserToken();
    fetchQueueData();
  }, [queueId]); // Removed fetchQueueData and showError from dependencies to prevent loops

  // Handle message submission callback (optional - MessageInput handles success internally)
  const handleMessageSubmit = useCallback(() => {
    // Messages will be updated via SSE automatically
    console.log('Message submitted - SSE will update the list');
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="queue-page queue-page--loading">
        <div className="queue-page__container">
          <div className="queue-page__loading">
            <div className="queue-page__loading-spinner" />
            <p className="queue-page__loading-text">Loading queue...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !queueData) {
    return (
      <div className="queue-page queue-page--error">
        <div className="queue-page__container">
          <div className="queue-page__error">
            <div className="queue-page__error-icon">
              <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="queue-page__error-title">Queue Not Found</h2>
            <p className="queue-page__error-message">
              {error || 'The queue you\'re looking for doesn\'t exist or has expired.'}
            </p>
            <button 
              className="btn btn--primary"
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="queue-page">
      <div className="queue-page__container">
        {/* Header Section */}
        <div className="queue-page__header">
          <QueueHeader
            queueId={queueId!}
            queueName={queueData.name}
            expiresAt={queueData.expires_at || ''}
            currentSort={currentSort}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Main Content */}
        <div className="queue-page__main">
          {/* Message List */}
          <div className="queue-page__messages">
            <MessageList
              queueId={queueId!}
              currentSort={currentSort}
              onQueueUpdate={handleQueueUpdate}
            />
          </div>

          {/* Input Area */}
          <div className="queue-page__input">
            <MessageInput
              queueId={queueId!}
              onMessageSent={handleMessageSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Queue;