from datetime import datetime, timedelta
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.schema import UniqueConstraint, Index
import uuid

Base = declarative_base()

class Queue(Base):
    __tablename__ = 'queues'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=True)
    host_secret = Column(UUID(as_uuid=True), nullable=False, default=uuid.uuid4, unique=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    # Queue settings
    default_sort_order = Column(String(10), nullable=False, default='votes')  # 'votes' or 'newest'
    
    # Relationships
    messages = relationship("Message", back_populates="queue", cascade="all, delete-orphan")
    hand_raises = relationship("HandRaise", back_populates="queue", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_expires_at', 'expires_at'),
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.expires_at:
            if not self.created_at:
                self.created_at = datetime.utcnow()
            self.expires_at = self.created_at + timedelta(hours=24)

class Message(Base):
    __tablename__ = 'messages'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    queue_id = Column(UUID(as_uuid=True), ForeignKey('queues.id'), nullable=False)
    text = Column(Text, nullable=False)
    author_name = Column(String(255), nullable=True)
    user_token = Column(UUID(as_uuid=True), nullable=False)
    vote_count = Column(Integer, nullable=False, default=0)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    queue = relationship("Queue", back_populates="messages")
    upvotes = relationship("MessageUpvote", back_populates="message", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_queue_id', 'queue_id'),
        Index('idx_created_at', 'created_at'),
        Index('idx_vote_count', 'vote_count'),
    )

class MessageUpvote(Base):
    __tablename__ = 'message_upvotes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey('messages.id'), nullable=False)
    user_token = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    message = relationship("Message", back_populates="upvotes")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('message_id', 'user_token', name='uq_message_user'),
        Index('idx_message_id', 'message_id'),
        Index('idx_user_token', 'user_token'),
    )

class HandRaise(Base):
    __tablename__ = 'hand_raises'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    queue_id = Column(UUID(as_uuid=True), ForeignKey('queues.id'), nullable=False)
    user_token = Column(String(255), nullable=False)
    user_name = Column(String(255), nullable=False)
    raised_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    queue = relationship("Queue", back_populates="hand_raises")

    # Constraints and Indexes
    __table_args__ = (
        # For SQLite compatibility, we'll handle the unique constraint in application logic
        Index('idx_queue_completed_raised', 'queue_id', 'completed', 'raised_at'),
        Index('idx_queue_id_handraise', 'queue_id'),
        Index('idx_user_token_handraise', 'user_token'),
    )