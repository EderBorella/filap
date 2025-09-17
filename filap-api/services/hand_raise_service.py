from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc, asc
from database import db
from models.models import Queue, HandRaise
from services.events import EventService
import uuid

class HandRaiseService:
    """Service layer for hand raise management operations"""

    @staticmethod
    def raise_hand(queue_id: str, user_token: str, user_name: str) -> Optional[Dict[str, Any]]:
        """
        Raise a hand for a user in a queue (or lower if already raised)

        Args:
            queue_id: Queue UUID
            user_token: User's token for identification
            user_name: User's display name

        Returns:
            Dict containing hand raise data or None if hand was lowered/queue not found
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
            HandRaiseService._delete_expired_queue(queue)
            return None

        # Validate inputs
        user_name = user_name.strip()
        if not user_name or len(user_name) > 100:
            raise ValueError("User name must be 1-100 characters")

        # Check if user already has an active hand raise
        existing_raise = db.session.query(HandRaise).filter_by(
            queue_id=queue_uuid,
            user_token=user_token,
            completed=False
        ).first()

        if existing_raise:
            # User already has active hand raise - remove it (toggle off)
            try:
                db.session.delete(existing_raise)
                db.session.commit()

                # Broadcast real-time update
                EventService.broadcast_hand_raise_removed(queue_id, str(existing_raise.id))

                return None  # Indicates hand was lowered

            except IntegrityError:
                db.session.rollback()
                raise ValueError("Failed to remove hand raise")

        # Create new hand raise
        hand_raise = HandRaise(
            queue_id=queue_uuid,
            user_token=user_token,
            user_name=user_name
        )

        try:
            db.session.add(hand_raise)
            db.session.commit()

            hand_raise_data = HandRaiseService._hand_raise_to_dict(hand_raise)

            # Broadcast real-time update
            EventService.broadcast_hand_raise_new(queue_id, hand_raise_data)

            return hand_raise_data

        except IntegrityError:
            db.session.rollback()
            raise ValueError("Failed to create hand raise")

    @staticmethod
    def get_hand_raises(queue_id: str, include_completed: bool = False) -> Optional[Dict[str, Any]]:
        """
        Get hand raises for a queue

        Args:
            queue_id: Queue UUID
            include_completed: Whether to include completed hand raises

        Returns:
            Dict with hand raises or None if queue not found
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
            HandRaiseService._delete_expired_queue(queue)
            return None

        # Build query
        query = db.session.query(HandRaise).filter_by(queue_id=queue_uuid)

        if not include_completed:
            query = query.filter_by(completed=False)

        # Order by raised_at (first come, first served)
        query = query.order_by(asc(HandRaise.raised_at))

        hand_raises = query.all()

        # Separate active and completed
        active_raises = []
        completed_raises = []

        for hand_raise in hand_raises:
            hand_raise_data = HandRaiseService._hand_raise_to_dict(hand_raise)
            if hand_raise.completed:
                completed_raises.append(hand_raise_data)
            else:
                active_raises.append(hand_raise_data)

        return {
            "active_hand_raises": active_raises,
            "completed_hand_raises": completed_raises,
            "total_active": len(active_raises),
            "total_completed": len(completed_raises)
        }

    @staticmethod
    def update_hand_raise(queue_id: str, hand_raise_id: str, host_secret: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a hand raise (host only - primarily for marking as completed)

        Args:
            queue_id: Queue UUID
            hand_raise_id: HandRaise UUID
            host_secret: Host authentication secret
            updates: Dict containing fields to update

        Returns:
            Updated hand raise data or None if unauthorized/not found
        """
        try:
            queue_uuid = uuid.UUID(queue_id)
            hand_raise_uuid = uuid.UUID(hand_raise_id)
            secret_uuid = uuid.UUID(host_secret)
        except ValueError:
            return None

        # Verify host access
        queue = db.session.query(Queue).filter_by(
            id=queue_uuid,
            host_secret=secret_uuid
        ).first()

        if not queue:
            return None

        # Check if queue has expired
        if queue.expires_at < datetime.utcnow():
            HandRaiseService._delete_expired_queue(queue)
            return None

        # Get hand raise
        hand_raise = db.session.query(HandRaise).filter_by(
            id=hand_raise_uuid,
            queue_id=queue_uuid
        ).first()

        if not hand_raise:
            return None

        # Update allowed fields
        allowed_fields = {"completed"}
        updated = False

        for field, value in updates.items():
            if field in allowed_fields:
                if field == "completed" and value:
                    # Mark as completed with timestamp
                    setattr(hand_raise, field, value)
                    setattr(hand_raise, "completed_at", datetime.utcnow())
                    updated = True
                elif field == "completed" and not value:
                    # Mark as not completed, clear timestamp
                    setattr(hand_raise, field, value)
                    setattr(hand_raise, "completed_at", None)
                    updated = True

        if updated:
            try:
                db.session.commit()

                hand_raise_data = HandRaiseService._hand_raise_to_dict(hand_raise)

                # Broadcast real-time update
                EventService.broadcast_hand_raise_updated(queue_id, hand_raise_data)

                return hand_raise_data

            except IntegrityError:
                db.session.rollback()
                raise ValueError("Failed to update hand raise")

        return HandRaiseService._hand_raise_to_dict(hand_raise)

    @staticmethod
    def get_user_position(queue_id: str, user_token: str) -> Optional[int]:
        """
        Get the position of a user in the hand raise queue

        Args:
            queue_id: Queue UUID
            user_token: User's token

        Returns:
            Position number (1-based) or None if not found/not raised
        """
        try:
            queue_uuid = uuid.UUID(queue_id)
        except ValueError:
            return None

        # Get user's hand raise
        user_raise = db.session.query(HandRaise).filter_by(
            queue_id=queue_uuid,
            user_token=user_token,
            completed=False
        ).first()

        if not user_raise:
            return None

        # Count how many hand raises came before this one
        earlier_raises = db.session.query(HandRaise).filter(
            HandRaise.queue_id == queue_uuid,
            HandRaise.completed == False,
            HandRaise.raised_at < user_raise.raised_at
        ).count()

        return earlier_raises + 1  # 1-based position

    @staticmethod
    def _hand_raise_to_dict(hand_raise: HandRaise) -> Dict[str, Any]:
        """
        Convert HandRaise model to dictionary

        Args:
            hand_raise: HandRaise model instance

        Returns:
            Dictionary representation
        """
        return {
            "id": str(hand_raise.id),
            "queue_id": str(hand_raise.queue_id),
            "user_token": hand_raise.user_token,
            "user_name": hand_raise.user_name,
            "raised_at": hand_raise.raised_at.isoformat() + "Z",
            "completed": hand_raise.completed,
            "completed_at": hand_raise.completed_at.isoformat() + "Z" if hand_raise.completed_at else None
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