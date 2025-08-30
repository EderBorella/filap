import json
import time
from typing import Dict, Any
from collections import defaultdict
import threading
import queue

class SSEManager:
    """Manages Server-Sent Events connections and broadcasts"""
    
    def __init__(self):
        # Store event queues per connection
        # Format: {queue_id: {connection_id: Queue}}
        self._connections: Dict[str, Dict[str, queue.Queue]] = defaultdict(dict)
        self._connection_counter = 0
        self._lock = threading.Lock()
    
    def add_connection(self, queue_id: str) -> tuple[str, queue.Queue]:
        """Add a new SSE connection for a queue"""
        with self._lock:
            connection_id = str(self._connection_counter)
            self._connection_counter += 1
            event_queue = queue.Queue()
            self._connections[queue_id][connection_id] = event_queue
            return connection_id, event_queue
    
    def remove_connection(self, queue_id: str, connection_id: str):
        """Remove an SSE connection"""
        with self._lock:
            if queue_id in self._connections:
                self._connections[queue_id].pop(connection_id, None)
                if not self._connections[queue_id]:
                    del self._connections[queue_id]
    
    def broadcast_to_queue(self, queue_id: str, event_type: str, data: Dict[str, Any]):
        """Broadcast an event to all connections for a specific queue"""
        with self._lock:
            if queue_id not in self._connections:
                return
            
            # Create SSE formatted message
            sse_data = self._format_sse_message(event_type, data)
            
            # Get copy of connections to avoid modification during iteration
            connections = dict(self._connections[queue_id])
        
        # Send to all connection queues
        dead_connections = []
        for connection_id, event_queue in connections.items():
            try:
                event_queue.put(sse_data, timeout=1)
            except queue.Full:
                # Connection queue is full, mark as dead
                dead_connections.append(connection_id)
        
        # Clean up dead connections
        if dead_connections:
            with self._lock:
                for connection_id in dead_connections:
                    self._connections[queue_id].pop(connection_id, None)
                # Remove empty queue entry if no connections remain
                if not self._connections[queue_id]:
                    del self._connections[queue_id]
    
    def _format_sse_message(self, event_type: str, data: Dict[str, Any]) -> str:
        """Format data as SSE message"""
        json_data = json.dumps(data)
        return f"event: {event_type}\ndata: {json_data}\n\n"
    
    def create_event_stream(self, queue_id: str):
        """Create a generator for SSE stream"""
        def event_generator():
            connection_id, event_queue = self.add_connection(queue_id)
            
            try:
                # Send initial connection message
                yield "data: {\"event\": \"connected\"}\n\n"
                
                # Listen for events
                while True:
                    try:
                        # Wait for events with timeout for heartbeat
                        message = event_queue.get(timeout=30)
                        yield message
                    except queue.Empty:
                        # Send heartbeat if no events
                        yield "data: {\"event\": \"heartbeat\"}\n\n"
                        
            except GeneratorExit:
                # Client disconnected
                pass
            finally:
                self.remove_connection(queue_id, connection_id)
        
        return event_generator()

# Global SSE manager instance
sse_manager = SSEManager()


class EventService:
    """Service for broadcasting real-time events"""
    
    @staticmethod
    def broadcast_new_message(queue_id: str, message_data: Dict[str, Any]):
        """Broadcast when a new message is created"""
        sse_manager.broadcast_to_queue(
            queue_id=queue_id,
            event_type="new_message",
            data=message_data
        )
    
    @staticmethod
    def broadcast_message_updated(queue_id: str, message_data: Dict[str, Any]):
        """Broadcast when a message is updated (vote count, read status, etc.)"""
        sse_manager.broadcast_to_queue(
            queue_id=queue_id,
            event_type="message_updated",
            data=message_data
        )
    
    @staticmethod
    def broadcast_message_deleted(queue_id: str, message_id: str):
        """Broadcast when a message is deleted"""
        sse_manager.broadcast_to_queue(
            queue_id=queue_id,
            event_type="message_deleted",
            data={"id": message_id}
        )
    
    @staticmethod
    def broadcast_queue_updated(queue_id: str, queue_data: Dict[str, Any]):
        """Broadcast when queue settings are updated"""
        sse_manager.broadcast_to_queue(
            queue_id=queue_id,
            event_type="queue_updated",
            data=queue_data
        )