import React from 'react';
import { StorageService, MessageService } from '../../services';
import { useConfirmationModal } from '../ConfirmationModal';
import { useToast } from '../Toast';
import './MessageCard.scss';

export interface MessageCardProps {
  id: string;
  queueId: string;
  text: string;
  authorName?: string;
  voteCount: number;
  isRead: boolean;
  createdAt: string;
  hasUserVoted: boolean;
}

const MessageCard: React.FC<MessageCardProps> = ({
  id,
  queueId,
  text,
  authorName,
  voteCount,
  isRead,
  createdAt,
  hasUserVoted
}) => {
  const { showConfirmation, ConfirmationModalComponent } = useConfirmationModal();
  const { showSuccess, showError } = useToast();
  
  // Check if user is host
  const isHost = StorageService.isHost(queueId);

  // Format relative time
  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleVote = async (): Promise<void> => {
    // Prevent double voting
    if (hasUserVoted) {
      showError("You can't vote twice on the same message.");
      return;
    }

    try {
      const userToken = StorageService.getUserToken(queueId);
      if (!userToken) {
        showError('User token not found. Please refresh the page.');
        return;
      }

      await MessageService.upvoteMessage(id, userToken);
      showSuccess('Vote added!');
    } catch (error) {
      console.error('Error voting:', error);
      showError(`Failed to vote. You can't vote twice!`);
    }
  };

  const handleToggleRead = async (): Promise<void> => {
    if (!isHost) return;
    
    try {
      const hostSecret = StorageService.getHostSecret(queueId);
      if (!hostSecret) {
        showError('Host authentication required.');
        return;
      }

      await MessageService.updateMessage(
        queueId,
        id,
        { is_read: !isRead },
        hostSecret
      );
      
      showSuccess(isRead ? 'Marked as unread' : 'Marked as read');
    } catch (error) {
      console.error('Error toggling read status:', error);
      showError('Failed to update message. Please try again.');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!isHost) return;
    
    const confirmed = await showConfirmation({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger'
    });

    if (confirmed) {
      try {
        const hostSecret = StorageService.getHostSecret(queueId);
        if (!hostSecret) {
          showError('Host authentication required.');
          return;
        }

        await MessageService.deleteMessage(queueId, id, hostSecret);
        showSuccess('Message deleted successfully');
      } catch (error) {
        console.error('Error deleting message:', error);
        showError('Failed to delete message. Please try again.');
      }
    }
  };

  return (
    <>
      <div className={`message-card ${isRead ? 'message-card--read' : 'message-card--unread'}`}>
        {/* Left Section - Voting */}
        <div className="message-card__voting">
          <button
            className={`message-card__vote-button ${hasUserVoted ? 'message-card__vote-button--voted' : ''}`}
            onClick={handleVote}
            aria-label={hasUserVoted ? 'Remove vote' : 'Vote for this message'}
          >
            {hasUserVoted ? (
              // Filled heart icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            ) : (
              // Outlined heart icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
          
          <span className="message-card__vote-count">
            {voteCount}
          </span>
        </div>

        {/* Center Section - Content */}
        <div className="message-card__content">
          <div className="message-card__text">
            {text}
          </div>
          
          <div className="message-card__metadata">
            {authorName || 'Anonymous'} • {getRelativeTime(createdAt)}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="message-card__actions">
          {/* Read Status Indicator (All users) */}
          <div className="message-card__read-status">
            {isRead ? (
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                className="message-card__read-icon"
                name="Message has been read"
              >
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <div 
                className="message-card__unread-dot"
                title="Message is unread"
              />
            )}
          </div>

          {/* Host Actions - Only shown for hosts */}
          {isHost && (
            <div className="message-card__host-actions">
              {/* Toggle Read Button */}
              <button
                className="message-card__action-button"
                onClick={handleToggleRead}
                title={isRead ? 'Mark as unread' : 'Mark as read'}
                aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  {isRead ? (
                    // Eye slash (mark as unread)
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  ) : (
                    // Eye (mark as read)
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  )}
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Delete Button */}
              <button
                className="message-card__action-button message-card__action-button--danger"
                onClick={handleDelete}
                title="Delete message"
                aria-label="Delete message"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModalComponent />
    </>
  );
};

export default MessageCard;