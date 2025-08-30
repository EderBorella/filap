import pytest
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch
from services.message_service import MessageService
from services.queue_service import QueueService
from services.user_service import UserService

class TestMessageService:
    """Basic tests for MessageService"""
    
    @patch('services.message_service.EventService.broadcast_new_message')
    def test_create_message_broadcasts_event(self, mock_broadcast, test_db):
        """Test that creating a message triggers SSE broadcast"""
        # Create a queue first
        queue_data = QueueService.create_queue("Test Queue")
        queue_id = queue_data['id']
        user_token = str(uuid.uuid4())
        
        # Create message
        message_data = MessageService.create_message(
            queue_id=queue_id,
            text="Test message",
            user_token=user_token,
            author_name="Test User"
        )
        
        assert message_data is not None
        assert message_data['text'] == "Test message"
        assert message_data['author_name'] == "Test User"
        
        # Verify SSE broadcast was called
        mock_broadcast.assert_called_once_with(queue_id, message_data)
    
    def test_create_message_success(self, test_db):
        """Test successful message creation"""
        # Create a queue first
        queue_data = QueueService.create_queue("Test Queue")
        queue_id = queue_data['id']
        user_token = str(uuid.uuid4())
        
        # Create message
        message_data = MessageService.create_message(
            queue_id=queue_id,
            text="Test message",
            user_token=user_token,
            author_name="Test User"
        )
        
        assert message_data is not None
        assert message_data['text'] == "Test message"
        assert message_data['author_name'] == "Test User"
        assert message_data['user_token'] == user_token
        assert message_data['vote_count'] == 0
        assert message_data['is_read'] == False
    
    def test_create_message_invalid_queue(self, test_db):
        """Test message creation with invalid queue"""
        fake_queue_id = str(uuid.uuid4())
        user_token = str(uuid.uuid4())
        
        message_data = MessageService.create_message(
            queue_id=fake_queue_id,
            text="Test message",
            user_token=user_token
        )
        
        assert message_data is None
    
    @patch('services.message_service.EventService.broadcast_message_updated')
    def test_upvote_message_broadcasts_event(self, mock_broadcast, test_db):
        """Test that upvoting triggers SSE broadcast"""
        # Create queue and message
        queue_data = QueueService.create_queue("Test Queue")
        queue_id = queue_data['id']
        user_token = str(uuid.uuid4())
        
        message_data = MessageService.create_message(
            queue_id=queue_id,
            text="Test message",
            user_token=user_token
        )
        message_id = message_data['id']
        
        # Upvote with different user token
        voter_token = str(uuid.uuid4())
        upvoted_message = MessageService.upvote_message(message_id, voter_token)
        
        assert upvoted_message is not None
        assert upvoted_message['vote_count'] == 1
        
        # Verify SSE broadcast was called
        mock_broadcast.assert_called_once_with(queue_id, upvoted_message)
    
    def test_upvote_message_success(self, test_db):
        """Test successful message upvoting"""
        # Create queue and message
        queue_data = QueueService.create_queue("Test Queue")
        queue_id = queue_data['id']
        user_token = str(uuid.uuid4())
        
        message_data = MessageService.create_message(
            queue_id=queue_id,
            text="Test message",
            user_token=user_token
        )
        message_id = message_data['id']
        
        # Upvote with different user token
        voter_token = str(uuid.uuid4())
        upvoted_message = MessageService.upvote_message(message_id, voter_token)
        
        assert upvoted_message is not None
        assert upvoted_message['vote_count'] == 1
    
    def test_upvote_message_duplicate_vote(self, test_db):
        """Test duplicate upvoting prevention"""
        # Create queue and message
        queue_data = QueueService.create_queue("Test Queue")
        queue_id = queue_data['id']
        user_token = str(uuid.uuid4())
        
        message_data = MessageService.create_message(
            queue_id=queue_id,
            text="Test message",
            user_token=user_token
        )
        message_id = message_data['id']
        
        # First upvote
        voter_token = str(uuid.uuid4())
        upvoted_message = MessageService.upvote_message(message_id, voter_token)
        assert upvoted_message['vote_count'] == 1
        
        # Second upvote with same token should fail
        duplicate_upvote = MessageService.upvote_message(message_id, voter_token)
        assert duplicate_upvote is None
    
    @patch('services.message_service.EventService.broadcast_message_updated')
    def test_update_message_broadcasts_event(self, mock_broadcast, test_db):
        """Test that updating message triggers SSE broadcast"""
        # Create queue and message
        queue_data = QueueService.create_queue("Test Queue")
        queue_id = queue_data['id']
        user_token = str(uuid.uuid4())
        
        message_data = MessageService.create_message(
            queue_id=queue_id,
            text="Test message",
            user_token=user_token
        )
        message_id = message_data['id']
        
        # Update message as author
        updated_message = MessageService.update_message(
            queue_id=queue_id,
            message_id=message_id,
            auth_token=user_token,
            updates={'is_read': True},
            is_host=False
        )
        
        assert updated_message is not None
        assert updated_message['is_read'] == True
        
        # Verify SSE broadcast was called
        mock_broadcast.assert_called_once_with(queue_id, updated_message)
    
    def test_update_message_by_author(self, test_db):
        """Test message update by author"""
        # Create queue and message
        queue_data = QueueService.create_queue("Test Queue")
        queue_id = queue_data['id']
        user_token = str(uuid.uuid4())
        
        message_data = MessageService.create_message(
            queue_id=queue_id,
            text="Test message",
            user_token=user_token
        )
        message_id = message_data['id']
        
        # Update message as author
        updated_message = MessageService.update_message(
            queue_id=queue_id,
            message_id=message_id,
            auth_token=user_token,
            updates={'is_read': True},
            is_host=False
        )
        
        assert updated_message is not None
        assert updated_message['is_read'] == True

class TestUserService:
    """Basic tests for UserService"""
    
    def test_generate_user_token_success(self, test_db):
        """Test successful user token generation"""
        # Create a queue first
        queue_data = QueueService.create_queue("Test Queue")
        queue_id = queue_data['id']
        
        # Generate user token
        token_data = UserService.generate_user_token(queue_id)
        
        assert token_data is not None
        assert 'user_token' in token_data
        assert token_data['queue_id'] == queue_id
        assert 'expires_at' in token_data
    
    def test_generate_user_token_invalid_queue(self, test_db):
        """Test user token generation with invalid queue"""
        fake_queue_id = str(uuid.uuid4())
        
        token_data = UserService.generate_user_token(fake_queue_id)
        
        assert token_data is None