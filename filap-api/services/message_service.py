from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc, asc
from database import db
from models.models import Queue, Message, MessageUpvote
from services.events import EventService
import uuid

class MessageService:
    """Service layer for message management operations"""
    
    @staticmethod
    def create_message(queue_id: str, text: str, user_token: str, author_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Create a new message in a queue
        
        Args:
            queue_id: Queue UUID
            text: Message text content
            user_token: User's token for authentication
            author_name: Optional author name
            
        Returns:
            Dict containing message data or None if queue not found/expired
        """
        try:
            queue_uuid = uuid.UUID(queue_id)
            user_uuid = uuid.UUID(user_token)
        except ValueError:
            return None
        
        # Check if queue exists and is not expired
        queue = db.session.query(Queue).filter_by(id=queue_uuid).first()
        
        if not queue:
            return None
            
        # Check if queue has expired
        if queue.expires_at < datetime.utcnow():
            MessageService._delete_expired_queue(queue)
            return None
        
        # Validate and sanitize inputs
        text = text.strip()
        if not text or len(text) > 2000:  # Max message length
            raise ValueError("Message text must be 1-2000 characters")
        
        if author_name is not None:
            author_name = author_name.strip()
            if len(author_name) == 0:
                author_name = None
            elif len(author_name) > 100:  # Max author name length
                raise ValueError("Author name must be 100 characters or less")
        
        # Create message
        message = Message(
            queue_id=queue_uuid,
            text=text,
            user_token=user_uuid,
            author_name=author_name
        )
        
        try:
            db.session.add(message)
            db.session.commit()
            
            message_data = MessageService._message_to_dict(message)
            
            # Broadcast real-time update
            EventService.broadcast_new_message(queue_id, message_data)
            
            return message_data
            
        except IntegrityError:
            db.session.rollback()
            raise ValueError("Failed to create message")
    
    @staticmethod
    def get_messages(queue_id: str, user_token: Optional[str] = None, sort_by: Optional[str] = None, limit: int = 50, offset: int = 0) -> Optional[Dict[str, Any]]:
        """
        Get messages for a queue with pagination and sorting
        
        Args:
            queue_id: Queue UUID
            user_token: User token to check vote status (optional)
            sort_by: Sort order ("votes" or "newest", defaults to queue's default)
            limit: Number of messages to return (max 100)
            offset: Offset for pagination
            
        Returns:
            Dict with messages and total count, or None if queue not found
        """
        try:
            queue_uuid = uuid.UUID(queue_id)
        except ValueError:
            return None
        
        # Check if queue exists and is not expired
        queue = db.session.query(Queue).filter_by(id=queue_uuid).first()
        
        if not queue:
            return None
            
        # Check if queue has expired
        if queue.expires_at < datetime.utcnow():
            MessageService._delete_expired_queue(queue)
            return None
        
        # Validate pagination parameters
        limit = max(1, min(limit, 100))  # Between 1 and 100
        offset = max(0, offset)
        
        # Determine sort order
        if sort_by not in ["votes", "newest"]:
            sort_by = queue.default_sort_order
        
        # Build query with LEFT JOIN to get user vote status
        if user_token:
            # Query with vote status when user token is provided
            query = db.session.query(
                Message,
                MessageUpvote.message_id.isnot(None).label('has_user_voted')
            ).outerjoin(
                MessageUpvote,
                (MessageUpvote.message_id == Message.id) & (MessageUpvote.user_token == user_token)
            ).filter(Message.queue_id == queue_uuid)
        else:
            # Query without vote status when no user token
            query = db.session.query(Message).filter_by(queue_id=queue_uuid)
        
        # Apply sorting
        if sort_by == "votes":
            query = query.order_by(desc(Message.vote_count), desc(Message.created_at))
        else:  # newest
            query = query.order_by(desc(Message.created_at))
        
        # Get total count before pagination
        total_count = db.session.query(Message).filter_by(queue_id=queue_uuid).count()
        
        # Apply pagination and execute
        results = query.offset(offset).limit(limit).all()
        
        # Process results based on query type
        if user_token:
            # Extract message and vote status from tuple results
            messages_data = []
            for message, has_voted in results:
                messages_data.append(MessageService._message_to_dict(message, bool(has_voted)))
        else:
            # Simple message results without vote status
            messages_data = [MessageService._message_to_dict(msg) for msg in results]
        
        return {
            "messages": messages_data,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "sort_by": sort_by
        }
    
    @staticmethod
    def update_message(queue_id: str, message_id: str, auth_token: str, updates: Dict[str, Any], is_host: bool = True) -> Optional[Dict[str, Any]]:
        """
        Update a message (host or author)
        
        Args:
            queue_id: Queue UUID
            message_id: Message UUID
            auth_token: Host secret or author token
            updates: Dict containing fields to update
            is_host: True if using host authentication, False for author
            
        Returns:
            Updated message data or None if unauthorized/not found
        """
        try:
            queue_uuid = uuid.UUID(queue_id)
            message_uuid = uuid.UUID(message_id)
            token_uuid = uuid.UUID(auth_token)
        except ValueError:
            return None
        
        if is_host:
            # Verify host access
            queue = db.session.query(Queue).filter_by(
                id=queue_uuid,
                host_secret=token_uuid
            ).first()
            
            if not queue:
                return None
                
            # Check if queue has expired
            if queue.expires_at < datetime.utcnow():
                MessageService._delete_expired_queue(queue)
                return None
            
            # Get message
            message = db.session.query(Message).filter_by(
                id=message_uuid,
                queue_id=queue_uuid
            ).first()
        else:
            # Verify author access - check both message and queue existence/expiry
            message = db.session.query(Message).join(Queue).filter(
                Message.id == message_uuid,
                Message.queue_id == queue_uuid,
                Message.user_token == token_uuid,
                Queue.expires_at > datetime.utcnow()
            ).first()
        
        if not message:
            return None
        
        # Update allowed fields
        allowed_fields = {"is_read"}
        updated = False
        
        for field, value in updates.items():
            if field in allowed_fields:
                setattr(message, field, value)
                updated = True
        
        if updated:
            try:
                db.session.commit()
                
                message_data = MessageService._message_to_dict(message)
                
                # Broadcast real-time update
                EventService.broadcast_message_updated(queue_id, message_data)
                
                return message_data
                
            except IntegrityError:
                db.session.rollback()
                raise ValueError("Failed to update message")
        
        return MessageService._message_to_dict(message)
    
    @staticmethod
    def delete_message(queue_id: str, message_id: str, host_secret: str) -> bool:
        """
        Delete a message (host only)
        
        Args:
            queue_id: Queue UUID
            message_id: Message UUID
            host_secret: Host authentication secret
            
        Returns:
            True if deleted, False if unauthorized/not found
        """
        try:
            queue_uuid = uuid.UUID(queue_id)
            message_uuid = uuid.UUID(message_id)
            secret_uuid = uuid.UUID(host_secret)
        except ValueError:
            return False
        
        # Verify host access
        queue = db.session.query(Queue).filter_by(
            id=queue_uuid,
            host_secret=secret_uuid
        ).first()
        
        if not queue:
            return False
            
        # Check if queue has expired
        if queue.expires_at < datetime.utcnow():
            MessageService._delete_expired_queue(queue)
            return False
        
        # Get message
        message = db.session.query(Message).filter_by(
            id=message_uuid,
            queue_id=queue_uuid
        ).first()
        
        if not message:
            return False
        
        try:
            db.session.delete(message)
            db.session.commit()
            
            # Broadcast real-time update
            EventService.broadcast_message_deleted(queue_id, message_id)
            
            return True
            
        except IntegrityError:
            db.session.rollback()
            return False
    
    @staticmethod
    def upvote_message(message_id: str, user_token: str) -> Optional[Dict[str, Any]]:
        """
        Add an upvote to a message
        
        Args:
            message_id: Message UUID
            user_token: User's token identifier
            
        Returns:
            Updated message data or None if not found/already voted
        """
        try:
            message_uuid = uuid.UUID(message_id)
        except ValueError:
            return None
        
        # Get message and its queue
        message = db.session.query(Message).join(Queue).filter(
            Message.id == message_uuid,
            Queue.expires_at > datetime.utcnow()  # Ensure queue not expired
        ).first()
        
        if not message:
            return None
        
        # Check if user already voted
        existing_vote = db.session.query(MessageUpvote).filter_by(
            message_id=message_uuid,
            user_token=user_token
        ).first()
        
        if existing_vote:
            # User already voted - remove the vote (toggle off)
            try:
                db.session.delete(existing_vote)
                
                # Atomically decrement vote count
                db.session.query(Message).filter_by(id=message_uuid).update({
                    Message.vote_count: Message.vote_count - 1
                })
                
                db.session.commit()
                
                # Refresh message to get updated vote count
                db.session.refresh(message)
                
                # User just removed their vote, so has_user_voted = False
                message_data = MessageService._message_to_dict(message, False)
                
                # Broadcast real-time update
                EventService.broadcast_message_updated(str(message.queue_id), message_data)
                
                return message_data
                
            except IntegrityError:
                db.session.rollback()
                return None
        
        # Create upvote
        upvote = MessageUpvote(
            message_id=message_uuid,
            user_token=user_token
        )
        
        try:
            db.session.add(upvote)
            
            # Atomically increment vote count
            db.session.query(Message).filter_by(id=message_uuid).update({
                Message.vote_count: Message.vote_count + 1
            })
            
            db.session.commit()
            
            # Refresh message to get updated vote count
            db.session.refresh(message)
            
            # User just added their vote, so has_user_voted = True
            message_data = MessageService._message_to_dict(message, True)
            
            # Broadcast real-time update
            EventService.broadcast_message_updated(str(message.queue_id), message_data)
            
            return message_data
            
        except IntegrityError:
            # Race condition - user voted between check and insert
            db.session.rollback()
            return None
    
    @staticmethod
    def _message_to_dict(message: Message, has_user_voted: bool = False) -> Dict[str, Any]:
        """
        Convert Message model to dictionary
        
        Args:
            message: Message model instance
            has_user_voted: Whether the user has voted for this message
            
        Returns:
            Dictionary representation
        """
        return {
            "id": str(message.id),
            "queue_id": str(message.queue_id),
            "text": message.text,
            "author_name": message.author_name,
            "user_token": str(message.user_token),
            "vote_count": message.vote_count,
            "is_read": message.is_read,
            "has_user_voted": has_user_voted,
            "created_at": message.created_at.isoformat() + "Z",
            "updated_at": message.updated_at.isoformat() + "Z"
        }
    
    @staticmethod
    def _delete_expired_queue(queue: Queue) -> None:
        """
        Delete an expired queue
        
        Args:
            queue: Queue model instance to delete
        """
        db.session.delete(queue)
        db.session.commit()