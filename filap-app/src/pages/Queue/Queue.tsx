import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { QueueService } from '../../services';
import { StorageService } from '../../services';
import { useToast } from '../../components/Toast';
import QueueHeader, { type SortOption } from '../../components/QueueHeader';
import MessageList from '../../components/MessageList';
import MessageInput from '../../components/MessageInput';
import LanguageToggle from '../../components/LanguageToggle';
import './Queue.scss';

interface QueueData {
  id?: string;
  name?: string;
  expires_at?: string;
  default_sort_order?: SortOption;
}

const Queue: React.FC = () => {
  const { t } = useTranslation();
  const { queueId } = useParams<{ queueId: string }>();
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSort, setCurrentSort] = useState<SortOption>('votes');
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess, showInfo } = useToast();

  // Fetch queue data
  const fetchQueueData = useCallback(async () => {
    if (!queueId) {
      setError(t('toast.errors.queueNotFound'));
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
      setError(t('queue.notFound'));
      showError(t('toast.errors.queueNotFound'));
    } finally {
      setLoading(false);
    }
  }, [queueId, showError]);

  // Handle sort change (host only)
  const handleSortChange = useCallback(async (newSort: SortOption) => {
    if (!queueData || !queueId) return;

    const isHost = StorageService.isHost(queueId);
    if (!isHost) {
      showError(t('toast.errors.onlyHostCanSort'));
      return;
    }

    try {
      const hostSecret = StorageService.getHostSecret(queueId);
      if (!hostSecret) {
        showError(t('toast.errors.hostAuthRequired'));
        return;
      }

      // Update queue sort order on backend
      await QueueService.updateQueue(queueId, {
        default_sort_order: newSort
      }, hostSecret);

      // Update local state
      setCurrentSort(newSort);
      setQueueData(prev => prev ? { ...prev, default_sort_order: newSort } : null);
      
      const sortLabel = newSort === 'votes' ? t('queue.mostVotes') : t('queue.newest');
      showSuccess(t('toast.sortOrderChanged', { order: sortLabel }));
    } catch (error) {
      console.error('Error updating sort order:', error);
      showError(t('toast.errors.updateSortFailed'));
    }
  }, [queueData, queueId, showError, showSuccess]);

  // Handle real-time queue updates from SSE
  const handleQueueUpdate = useCallback((updatedQueueData: Partial<QueueData>) => {
    let updated = false;
    if (updatedQueueData.default_sort_order && updatedQueueData.default_sort_order !== currentSort) {
        setCurrentSort(updatedQueueData.default_sort_order);
        const sortLabel = updatedQueueData.default_sort_order === 'votes' ? t('queue.mostVotes') : t('queue.newest');
        showInfo(t('toast.sortOrderUpdated', { order: sortLabel }));
        updated = true;
    }
    if (updatedQueueData.name && updatedQueueData.name !== queueData?.name) {
        setQueueData(prev => prev ? { ...prev, name: updatedQueueData.name } : null);
        if (!updated) { // Avoid double toast
            showInfo(t('toast.queueNameUpdated'));
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
        showError(t('toast.errors.backendNotRunning'));
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
            <p className="queue-page__loading-text">{t('queue.loading')}</p>
          </div>
        </div>
        <LanguageToggle />
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
            <h2 className="queue-page__error-title">{t('queue.notFound')}</h2>
            <p className="queue-page__error-message">
              {error || t('queue.notFoundDescription')}
            </p>
            <button 
              className="btn btn--primary"
              onClick={() => window.location.href = '/'}
            >
              {t('queue.goHome')}
            </button>
          </div>
        </div>
        <LanguageToggle />
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

      {/* Fixed language toggle */}
      <LanguageToggle />
    </div>
  );
};

export default Queue;