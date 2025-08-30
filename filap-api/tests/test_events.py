import pytest
import json
import time
import threading
import uuid
from unittest.mock import patch, MagicMock
from services.events import SSEManager, EventService, sse_manager
import queue as queue_module

@pytest.mark.unit
class TestSSEManager:
    
    def test_sse_manager_initialization(self):
        """Test SSE manager initializes correctly"""
        manager = SSEManager()
        assert manager._connections == {}
        assert manager._connection_counter == 0
    
    def test_add_connection(self):
        """Test adding a connection"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        connection_id, event_queue = manager.add_connection(queue_id)
        
        assert connection_id == "0"
        assert isinstance(event_queue, queue_module.Queue)
        assert queue_id in manager._connections
        assert connection_id in manager._connections[queue_id]
    
    def test_remove_connection(self):
        """Test removing a connection"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        connection_id, event_queue = manager.add_connection(queue_id)
        assert queue_id in manager._connections
        
        manager.remove_connection(queue_id, connection_id)
        assert queue_id not in manager._connections
    
    def test_multiple_connections_same_queue(self):
        """Test multiple connections to the same queue"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        conn1_id, queue1 = manager.add_connection(queue_id)
        conn2_id, queue2 = manager.add_connection(queue_id)
        
        assert conn1_id == "0"
        assert conn2_id == "1"
        assert len(manager._connections[queue_id]) == 2
        
        # Remove one connection
        manager.remove_connection(queue_id, conn1_id)
        assert len(manager._connections[queue_id]) == 1
        assert conn2_id in manager._connections[queue_id]
    
    def test_broadcast_to_queue(self):
        """Test broadcasting to queue connections"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        # Add connections
        conn1_id, queue1 = manager.add_connection(queue_id)
        conn2_id, queue2 = manager.add_connection(queue_id)
        
        # Broadcast message
        test_data = {"message": "test", "id": "123"}
        manager.broadcast_to_queue(queue_id, "new_message", test_data)
        
        # Check both queues received the message
        message1 = queue1.get_nowait()
        message2 = queue2.get_nowait()
        
        expected = "event: new_message\ndata: {\"message\": \"test\", \"id\": \"123\"}\n\n"
        assert message1 == expected
        assert message2 == expected
    
    def test_broadcast_to_nonexistent_queue(self):
        """Test broadcasting to queue with no connections"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        # Should not raise exception
        manager.broadcast_to_queue(queue_id, "test", {"data": "test"})
        assert queue_id not in manager._connections
    
    def test_format_sse_message(self):
        """Test SSE message formatting"""
        manager = SSEManager()
        
        data = {"id": "123", "text": "Hello world"}
        formatted = manager._format_sse_message("new_message", data)
        
        expected = "event: new_message\ndata: {\"id\": \"123\", \"text\": \"Hello world\"}\n\n"
        assert formatted == expected
    
    def test_create_event_stream(self):
        """Test event stream creation"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        stream = manager.create_event_stream(queue_id)
        
        # Get first message (connection message)
        first_message = next(stream)
        assert first_message == "data: {\"event\": \"connected\"}\n\n"
        
        # Verify connection was added
        assert queue_id in manager._connections
        assert len(manager._connections[queue_id]) == 1

@pytest.mark.unit 
class TestEventService:
    
    @patch('services.events.sse_manager')
    def test_broadcast_new_message(self, mock_sse_manager):
        """Test broadcasting new message event"""
        queue_id = str(uuid.uuid4())
        message_data = {"id": "123", "text": "Hello"}
        
        EventService.broadcast_new_message(queue_id, message_data)
        
        mock_sse_manager.broadcast_to_queue.assert_called_once_with(
            queue_id=queue_id,
            event_type="new_message",
            data=message_data
        )
    
    @patch('services.events.sse_manager')
    def test_broadcast_message_updated(self, mock_sse_manager):
        """Test broadcasting message updated event"""
        queue_id = str(uuid.uuid4())
        message_data = {"id": "123", "vote_count": 5}
        
        EventService.broadcast_message_updated(queue_id, message_data)
        
        mock_sse_manager.broadcast_to_queue.assert_called_once_with(
            queue_id=queue_id,
            event_type="message_updated", 
            data=message_data
        )
    
    @patch('services.events.sse_manager')
    def test_broadcast_message_deleted(self, mock_sse_manager):
        """Test broadcasting message deleted event"""
        queue_id = str(uuid.uuid4())
        message_id = str(uuid.uuid4())
        
        EventService.broadcast_message_deleted(queue_id, message_id)
        
        mock_sse_manager.broadcast_to_queue.assert_called_once_with(
            queue_id=queue_id,
            event_type="message_deleted",
            data={"id": message_id}
        )
    
    @patch('services.events.sse_manager')
    def test_broadcast_queue_updated(self, mock_sse_manager):
        """Test broadcasting queue updated event"""
        queue_id = str(uuid.uuid4())
        queue_data = {"id": queue_id, "name": "Updated Queue"}
        
        EventService.broadcast_queue_updated(queue_id, queue_data)
        
        mock_sse_manager.broadcast_to_queue.assert_called_once_with(
            queue_id=queue_id,
            event_type="queue_updated",
            data=queue_data
        )

@pytest.mark.integration
class TestSSEIntegration:
    
    def test_full_event_flow(self):
        """Test complete event flow from broadcast to reception"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        # Create connection
        connection_id, event_queue = manager.add_connection(queue_id)
        
        # Broadcast event
        test_data = {"id": "123", "text": "Integration test"}
        manager.broadcast_to_queue(queue_id, "test_event", test_data)
        
        # Receive event
        received = event_queue.get(timeout=1)
        
        assert "event: test_event" in received
        assert "Integration test" in received
        assert "123" in received
    
    def test_multiple_queue_isolation(self):
        """Test that events are isolated between queues"""
        manager = SSEManager()
        queue1_id = str(uuid.uuid4())
        queue2_id = str(uuid.uuid4())
        
        # Create connections to different queues
        conn1_id, queue1 = manager.add_connection(queue1_id)
        conn2_id, queue2 = manager.add_connection(queue2_id)
        
        # Broadcast to queue1 only
        manager.broadcast_to_queue(queue1_id, "test", {"data": "queue1"})
        
        # Only queue1 should receive the message
        message1 = queue1.get_nowait()
        assert "queue1" in message1
        
        # queue2 should be empty
        with pytest.raises(queue_module.Empty):
            queue2.get_nowait()
    
    def test_connection_cleanup_after_exception(self):
        """Test connections are cleaned up properly after errors"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        # Add connection
        connection_id, event_queue = manager.add_connection(queue_id)
        assert len(manager._connections[queue_id]) == 1
        
        # Simulate queue being full (connection dead)
        with patch.object(event_queue, 'put', side_effect=queue_module.Full):
            manager.broadcast_to_queue(queue_id, "test", {"data": "test"})
        
        # Connection should be removed
        assert queue_id not in manager._connections

@pytest.mark.slow
class TestSSEPerformance:
    
    def test_many_connections_performance(self):
        """Test performance with many connections"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        # Create many connections
        connections = []
        for i in range(100):
            conn_id, event_queue = manager.add_connection(queue_id)
            connections.append((conn_id, event_queue))
        
        # Time a broadcast
        start_time = time.time()
        manager.broadcast_to_queue(queue_id, "performance_test", {"id": "test"})
        broadcast_time = time.time() - start_time
        
        # Should complete quickly (< 1 second for 100 connections)
        assert broadcast_time < 1.0
        
        # Verify all connections received the message
        for conn_id, event_queue in connections:
            message = event_queue.get_nowait()
            assert "performance_test" in message
    
    def test_thread_safety(self):
        """Test thread safety of SSE manager"""
        manager = SSEManager()
        queue_id = str(uuid.uuid4())
        
        connections = []
        errors = []
        
        def add_connections():
            try:
                for i in range(50):
                    conn_id, event_queue = manager.add_connection(queue_id)
                    connections.append((conn_id, event_queue))
            except Exception as e:
                errors.append(e)
        
        def broadcast_events():
            try:
                for i in range(20):
                    manager.broadcast_to_queue(queue_id, "thread_test", {"id": i})
                    time.sleep(0.01)
            except Exception as e:
                errors.append(e)
        
        # Run concurrently
        threads = [
            threading.Thread(target=add_connections),
            threading.Thread(target=add_connections),
            threading.Thread(target=broadcast_events),
        ]
        
        for thread in threads:
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # Should not have any errors
        assert len(errors) == 0
        assert len(connections) == 100