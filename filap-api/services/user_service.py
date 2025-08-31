from typing import Dict, Any, Optional
import uuid

class UserService:
    """Service layer for user token management"""
    
    @staticmethod
    def generate_user_token(queue_id: str) -> Optional[Dict[str, Any]]:
        """
        Generate a new user token for a queue
        
        Args:
            queue_id: Queue UUID to validate existence
            
        Returns:
            Dict containing user_token or None if queue not found
        """
        from datetime import datetime
        from database import db
        from models.models import Queue
        
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
            # Delete expired queue
            db.session.delete(queue)
            db.session.commit()
            return None
        
        # Generate new user token
        user_token = str(uuid.uuid4())
        
        return {
            "user_token": user_token,
            "queue_id": queue_id,
            "expires_at": queue.expires_at.isoformat() + "Z"
        }