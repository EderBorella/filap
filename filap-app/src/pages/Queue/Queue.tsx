import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { QueueService } from '../../services';
import { StorageService } from '../../services';
import { useToast } from '../../components/Toast';
import QueueHeader, { type SortOption } from '../../components/QueueHeader';
import MessageList from '../../components/MessageList';
import MessageInput from '../../components/MessageInput';
import HandRaiseList from '../../components/HandRaiseList';
import HandRaiseInput from '../../components/HandRaiseInput';
import TabNavigation, { type TabKey } from '../../components/TabNavigation';
import LanguageToggle from '../../components/LanguageToggle';
import FloatingInput from '../../components/FloatingInput';
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
  const [activeTab, setActiveTab] = useState<TabKey>('questions');
  const [messageCount, setMessageCount] = useState(0);
  const [handRaiseCount, setHandRaiseCount] = useState(0);
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
          if (!response.user_token) {
            throw new Error('Failed to generate user token');
          }
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

  // Handle hand raise update callback
  const handleHandRaiseUpdate = useCallback((data: any) => {
    setHandRaiseCount(data.total_active || 0);
  }, []);

  // Handle message list update callback (for message count)
  const handleMessageListUpdate = useCallback((messages: any[]) => {
    setMessageCount(messages.length);
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
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

        {/* Tab Navigation */}
        <div className="queue-page__tabs">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            questionCount={messageCount}
            handRaiseCount={handRaiseCount}
          />
        </div>

        {/* Main Content */}
        <div className="queue-page__main">
          {activeTab === 'questions' ? (
            <>
              {/* Message List */}
              <div className="queue-page__messages">
                <MessageList
                  queueId={queueId!}
                  currentSort={currentSort}
                  onQueueUpdate={handleQueueUpdate}
                />
              </div>

              {/* Floating Message Input */}
              <FloatingInput
                buttonText={t('messageInput.askQuestion')}
                title={t('messageInput.askQuestion')}
                buttonIcon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                }
                className="queue-page__floating-input"
              >
                <MessageInput
                  queueId={queueId!}
                  onMessageSent={handleMessageSubmit}
                />
              </FloatingInput>
            </>
          ) : (
            <>
              {/* Hand Raise List */}
              <div className="queue-page__hand-raises">
                <HandRaiseList
                  queueId={queueId!}
                  onHandRaiseUpdate={handleHandRaiseUpdate}
                />
              </div>

              {/* Floating Hand Raise Input */}
              <FloatingInput
                buttonText={t('handRaise.raiseHand')}
                title={t('handRaise.raiseHand')}
                buttonIcon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M13.5001 3.75C13.9143 3.75 14.2501 4.08579 14.2501 4.5V7.5V12.75H15.7501V7.5C15.7501 7.08579 16.0858 6.75 16.5001 6.75C16.9143 6.75 17.2501 7.08579 17.2501 7.5V15C17.2501 17.8995 14.8996 20.25 12.0001 20.25V21.75C15.728 21.75 18.7501 18.7279 18.7501 15V7.5C18.7501 6.25736 17.7427 5.25 16.5001 5.25C16.2371 5.25 15.9846 5.29512 15.7501 5.37803V4.5C15.7501 3.25736 14.7427 2.25 13.5001 2.25C12.4625 2.25 11.5889 2.95235 11.3289 3.90757C11.0724 3.80589 10.7927 3.75 10.5001 3.75C9.25742 3.75 8.25006 4.75736 8.25006 6V12.5344L7.77377 11.5689L7.77221 11.5657C7.21726 10.4539 5.86607 10.0024 4.75422 10.5574C3.65214 11.1075 3.1989 12.4399 3.7315 13.546L5.03741 16.7808L5.06205 16.8354C6.16787 19.047 7.45919 20.2994 8.73651 20.9857C10.0096 21.6696 11.194 21.75 12.0001 21.75V20.25C11.3061 20.25 10.4069 20.1803 9.44641 19.6643C8.49439 19.1528 7.40758 18.1618 6.41695 16.191L5.11239 12.9597L5.08798 12.9055C4.903 12.5349 5.05349 12.0845 5.4241 11.8995C5.79428 11.7147 6.24405 11.8646 6.42944 12.2343L8.32743 16.0818L9.75004 15.75V14.25H9.75006V6C9.75006 5.58579 10.0858 5.25 10.5001 5.25C10.9143 5.25 11.2501 5.58579 11.2501 6V12.75H12.7501V6V4.5C12.7501 4.08579 13.0858 3.75 13.5001 3.75Z" />
                  </svg>
                }
                className="queue-page__floating-input"
              >
                <HandRaiseInput
                  queueId={queueId!}
                />
              </FloatingInput>
            </>
          )}
        </div>
      </div>

      {/* Fixed language toggle */}
      <LanguageToggle />
    </div>
  );
};

export default Queue;