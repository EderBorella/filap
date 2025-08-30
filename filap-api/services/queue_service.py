from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from database import db
from models.models import Queue, Message, MessageUpvote
from services.events import EventService
from config import get_config
import uuid

class QueueService:
    """Service layer for queue management operations"""
    
    @staticmethod
    def create_queue(name: Optional[str] = None, default_sort_order: str = "votes") -> Dict[str, Any]:
        """
        Create a new queue
        
        Args:
            name: Optional queue name
            default_sort_order: Default sorting method ("votes" or "newest")
            
        Returns:
            Dict containing queue data including host_secret
        """
        # Validate sort order
        if default_sort_order not in ["votes", "newest"]:
            raise ValueError("default_sort_order must be 'votes' or 'newest'")
        
        # Create new queue
        queue = Queue(
            name=name,
            default_sort_order=default_sort_order
        )
        
        try:
            db.session.add(queue)
            db.session.commit()
            
            return QueueService._queue_to_dict(queue, include_secret=True)
            
        except IntegrityError:
            db.session.rollback()
            raise ValueError("Failed to create queue")
    
    @staticmethod
    def get_queue(queue_id: str) -> Optional[Dict[str, Any]]:
        """
        Get queue public information by ID
        
        Args:
            queue_id: Queue UUID
            
        Returns:
            Dict containing public queue data or None if not found
        """
        try:
            queue_uuid = uuid.UUID(queue_id)
        except ValueError:
            return None
        
        queue = db.session.query(Queue).filter_by(id=queue_uuid).first()
        
        if not queue:
            return None
            
        # Check if queue has expired
        if queue.expires_at < datetime.utcnow():
            # Queue expired, delete it
            QueueService._delete_expired_queue(queue)
            return None
        
        return QueueService._queue_to_dict(queue, include_secret=False)
    
    @staticmethod
    def update_queue(queue_id: str, host_secret: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update queue settings (host only)
        
        Args:
            queue_id: Queue UUID
            host_secret: Host authentication secret
            updates: Dict containing fields to update
            
        Returns:
            Updated queue data or None if unauthorized/not found
        """
        try:
            queue_uuid = uuid.UUID(queue_id)
            secret_uuid = uuid.UUID(host_secret)
        except ValueError:
            return None
        
        queue = db.session.query(Queue).filter_by(
            id=queue_uuid,
            host_secret=secret_uuid
        ).first()
        
        if not queue:
            return None
            
        # Check if queue has expired
        if queue.expires_at < datetime.utcnow():
            QueueService._delete_expired_queue(queue)
            return None
        
        # Update allowed fields
        allowed_fields = {"name", "default_sort_order"}
        updated = False
        
        for field, value in updates.items():
            if field in allowed_fields:
                if field == "default_sort_order" and value not in ["votes", "newest"]:
                    raise ValueError("default_sort_order must be 'votes' or 'newest'")
                    
                setattr(queue, field, value)
                updated = True
        
        if updated:
            try:
                db.session.commit()
                
                # Broadcast queue update to all connected clients
                queue_data = QueueService._queue_to_dict(queue, include_secret=False)
                EventService.broadcast_queue_updated(queue_id, queue_data)
                
                return queue_data
                
            except IntegrityError:
                db.session.rollback()
                raise ValueError("Failed to update queue")
        
        return QueueService._queue_to_dict(queue, include_secret=False)
    
    @staticmethod
    def verify_host_access(queue_id: str, host_secret: str) -> bool:
        """
        Verify if the provided host_secret is valid for the queue
        
        Args:
            queue_id: Queue UUID
            host_secret: Host authentication secret
            
        Returns:
            True if valid, False otherwise
        """
        try:
            queue_uuid = uuid.UUID(queue_id)
            secret_uuid = uuid.UUID(host_secret)
        except ValueError:
            return False
        
        queue = db.session.query(Queue).filter_by(
            id=queue_uuid,
            host_secret=secret_uuid
        ).first()
        
        if not queue:
            return False
            
        # Check if queue has expired
        if queue.expires_at < datetime.utcnow():
            QueueService._delete_expired_queue(queue)
            return False
            
        return True
    
    @staticmethod
    def cleanup_expired_queues() -> int:
        """
        Clean up all expired queues (for background tasks)
        
        Returns:
            Number of queues cleaned up
        """
        current_time = datetime.utcnow()
        expired_queues = db.session.query(Queue).filter(
            Queue.expires_at < current_time
        ).all()
        
        count = len(expired_queues)
        
        for queue in expired_queues:
            db.session.delete(queue)
        
        if count > 0:
            db.session.commit()
        
        return count
    
    @staticmethod
    def get_queue_stats() -> Dict[str, int]:
        """
        Get system statistics
        
        Returns:
            Dict with current queue count and other stats
        """
        current_time = datetime.utcnow()
        
        active_queues = db.session.query(Queue).filter(
            Queue.expires_at > current_time
        ).count()
        
        total_messages = db.session.query(Message).join(Queue).filter(
            Queue.expires_at > current_time
        ).count()
        
        return {
            "active_queues": active_queues,
            "total_messages": total_messages
        }
    
    @staticmethod
    def _queue_to_dict(queue: Queue, include_secret: bool = False) -> Dict[str, Any]:
        """
        Convert Queue model to dictionary
        
        Args:
            queue: Queue model instance
            include_secret: Whether to include host_secret
            
        Returns:
            Dictionary representation
        """
        data = {
            "id": str(queue.id),
            "name": queue.name,
            "default_sort_order": queue.default_sort_order,
            "created_at": queue.created_at.isoformat() + "Z",
            "expires_at": queue.expires_at.isoformat() + "Z"
        }
        
        if include_secret:
            data["host_secret"] = str(queue.host_secret)
        
        return data
    
    @staticmethod
    def _delete_expired_queue(queue: Queue) -> None:
        """
        Delete an expired queue
        
        Args:
            queue: Queue model instance to delete
        """
        db.session.delete(queue)
        db.session.commit()