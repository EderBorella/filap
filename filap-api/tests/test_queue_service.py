import pytest
from unittest.mock import patch
from services.queue_service import QueueService

@pytest.mark.unit
class TestQueueService:
    
    def test_create_queue_basic(self, test_db):
        """Test basic queue creation works"""
        result = QueueService.create_queue(name="Test Queue")
        
        assert result["name"] == "Test Queue"
        assert "id" in result
        assert "host_secret" in result
    
    def test_get_queue_success(self, test_db):
        """Test getting existing queue works"""
        created = QueueService.create_queue(name="Test Queue")
        queue_id = created["id"]
        
        result = QueueService.get_queue(queue_id)
        
        assert result is not None
        assert result["name"] == "Test Queue"
        assert "host_secret" not in result
    
    def test_verify_host_access_valid(self, test_db):
        """Test host access verification works"""
        created = QueueService.create_queue(name="Test Queue")
        queue_id = created["id"]
        host_secret = created["host_secret"]
        
        result = QueueService.verify_host_access(queue_id, host_secret)
        
        assert result is True
    
    @patch('services.queue_service.EventService.broadcast_queue_updated')
    def test_update_queue_triggers_sse(self, mock_broadcast, test_db):
        """Test that queue update triggers SSE broadcast"""
        created = QueueService.create_queue(name="Test Queue")
        queue_id = created["id"]
        host_secret = created["host_secret"]
        
        updates = {"name": "Updated Queue"}
        result = QueueService.update_queue(queue_id, host_secret, updates)
        
        # Verify SSE broadcast was called
        mock_broadcast.assert_called_once_with(queue_id, result)