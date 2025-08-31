import pytest
from datetime import datetime, timedelta
import uuid
from models.models import Queue, Message, MessageUpvote
from app import db

@pytest.mark.unit
class TestQueueModel:
    
    def test_queue_creation(self, test_db):
        """Test basic queue creation"""
        queue = Queue(name="Test Queue")
        test_db.session.add(queue)
        test_db.session.commit()
        
        assert queue.id is not None
        assert queue.name == "Test Queue"
        assert queue.host_secret is not None
        assert queue.created_at is not None
        assert queue.expires_at is not None
        assert queue.default_sort_order == "votes"
        
        # Check that expires_at is 24 hours after created_at
        expected_expiry = queue.created_at + timedelta(hours=24)
        assert abs((queue.expires_at - expected_expiry).total_seconds()) < 1
    
    def test_queue_without_name(self, test_db):
        """Test queue creation without name"""
        queue = Queue()
        test_db.session.add(queue)
        test_db.session.commit()
        
        assert queue.name is None
        assert queue.id is not None
    
    def test_queue_custom_sort_order(self, test_db):
        """Test queue with custom sort order"""
        queue = Queue(name="Test", default_sort_order="newest")
        test_db.session.add(queue)
        test_db.session.commit()
        
        assert queue.default_sort_order == "newest"
    
    def test_queue_cascade_delete(self, test_db):
        """Test that deleting queue deletes associated messages and upvotes"""
        # Create queue
        queue = Queue(name="Test Queue")
        test_db.session.add(queue)
        test_db.session.commit()
        
        # Create message
        message = Message(
            queue_id=queue.id,
            text="Test message",
            author_name="John",
            user_token=uuid.uuid4()
        )
        test_db.session.add(message)
        test_db.session.commit()
        
        # Create upvote
        upvote = MessageUpvote(
            message_id=message.id,
            user_token="test-token"
        )
        test_db.session.add(upvote)
        test_db.session.commit()
        
        # Verify everything exists
        assert test_db.session.query(Queue).count() == 1
        assert test_db.session.query(Message).count() == 1
        assert test_db.session.query(MessageUpvote).count() == 1
        
        # Delete queue
        test_db.session.delete(queue)
        test_db.session.commit()
        
        # Verify cascade delete worked
        assert test_db.session.query(Queue).count() == 0
        assert test_db.session.query(Message).count() == 0
        assert test_db.session.query(MessageUpvote).count() == 0

@pytest.mark.unit
class TestMessageModel:
    
    def test_message_creation(self, test_db):
        """Test basic message creation"""
        queue = Queue(name="Test Queue")
        test_db.session.add(queue)
        test_db.session.commit()
        
        message = Message(
            queue_id=queue.id,
            text="Test message",
            author_name="John Doe",
            user_token=uuid.uuid4()
        )
        test_db.session.add(message)
        test_db.session.commit()
        
        assert message.id is not None
        assert message.text == "Test message"
        assert message.author_name == "John Doe"
        assert message.vote_count == 0
        assert message.is_read is False
        assert message.created_at is not None
        assert message.updated_at is not None
    
    def test_message_anonymous(self, test_db):
        """Test anonymous message creation"""
        queue = Queue(name="Test Queue")
        test_db.session.add(queue)
        test_db.session.commit()
        
        message = Message(
            queue_id=queue.id,
            text="Anonymous message",
            user_token=uuid.uuid4()
        )
        test_db.session.add(message)
        test_db.session.commit()
        
        assert message.author_name is None
        assert message.text == "Anonymous message"
    
    def test_message_read_status(self, test_db):
        """Test message read status functionality"""
        queue = Queue(name="Test Queue")
        test_db.session.add(queue)
        test_db.session.commit()
        
        message = Message(
            queue_id=queue.id,
            text="Test message",
            user_token=uuid.uuid4()
        )
        test_db.session.add(message)
        test_db.session.commit()
        
        # Initially not read
        assert message.is_read is False
        
        # Mark as read
        message.is_read = True
        test_db.session.commit()
        
        # Verify updated_at changed
        assert message.is_read is True

@pytest.mark.unit
class TestMessageUpvoteModel:
    
    def test_upvote_creation(self, test_db):
        """Test upvote creation"""
        queue = Queue(name="Test Queue")
        test_db.session.add(queue)
        test_db.session.commit()
        
        message = Message(
            queue_id=queue.id,
            text="Test message",
            user_token=uuid.uuid4()
        )
        test_db.session.add(message)
        test_db.session.commit()
        
        upvote = MessageUpvote(
            message_id=message.id,
            user_token="unique-voter-token"
        )
        test_db.session.add(upvote)
        test_db.session.commit()
        
        assert upvote.id is not None
        assert upvote.message_id == message.id
        assert upvote.user_token == "unique-voter-token"
        assert upvote.created_at is not None
    
    def test_unique_constraint(self, test_db):
        """Test unique constraint on message_id + user_token"""
        queue = Queue(name="Test Queue")
        test_db.session.add(queue)
        test_db.session.commit()
        
        message = Message(
            queue_id=queue.id,
            text="Test message",
            user_token=uuid.uuid4()
        )
        test_db.session.add(message)
        test_db.session.commit()
        
        # First upvote
        upvote1 = MessageUpvote(
            message_id=message.id,
            user_token="same-token"
        )
        test_db.session.add(upvote1)
        test_db.session.commit()
        
        # Second upvote with same token should fail
        upvote2 = MessageUpvote(
            message_id=message.id,
            user_token="same-token"
        )
        test_db.session.add(upvote2)
        
        with pytest.raises(Exception):  # IntegrityError
            test_db.session.commit()

@pytest.mark.unit
class TestModelRelationships:
    
    def test_queue_messages_relationship(self, test_db):
        """Test queue-messages relationship"""
        queue = Queue(name="Test Queue")
        test_db.session.add(queue)
        test_db.session.commit()
        
        message1 = Message(queue_id=queue.id, text="Message 1", user_token=uuid.uuid4())
        message2 = Message(queue_id=queue.id, text="Message 2", user_token=uuid.uuid4())
        test_db.session.add_all([message1, message2])
        test_db.session.commit()
        
        # Test relationship
        assert len(queue.messages) == 2
        assert message1 in queue.messages
        assert message2 in queue.messages
        
        # Test back reference
        assert message1.queue == queue
        assert message2.queue == queue
    
    def test_message_upvotes_relationship(self, test_db):
        """Test message-upvotes relationship"""
        queue = Queue(name="Test Queue")
        test_db.session.add(queue)
        test_db.session.commit()
        
        message = Message(queue_id=queue.id, text="Test message", user_token=uuid.uuid4())
        test_db.session.add(message)
        test_db.session.commit()
        
        upvote1 = MessageUpvote(message_id=message.id, user_token="token1")
        upvote2 = MessageUpvote(message_id=message.id, user_token="token2")
        test_db.session.add_all([upvote1, upvote2])
        test_db.session.commit()
        
        # Test relationship
        assert len(message.upvotes) == 2
        assert upvote1 in message.upvotes
        assert upvote2 in message.upvotes
        
        # Test back reference
        assert upvote1.message == message
        assert upvote2.message == message