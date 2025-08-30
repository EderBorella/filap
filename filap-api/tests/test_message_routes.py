import pytest
import json
from unittest.mock import patch, MagicMock
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

class TestMessageRoutes:
    """Test message management endpoints"""
    
    def test_generate_user_token_success(self, client):
        """Test successful user token generation"""
        mock_token_data = {
            'user_token': 'test-token-123',
            'queue_id': 'test-queue-id',
            'expires_at': '2024-01-01T12:00:00Z'
        }
        
        with patch('services.user_service.UserService.generate_user_token') as mock_generate:
            mock_generate.return_value = mock_token_data
            
            response = client.post('/api/queues/test-queue-id/user-token')
            
            assert response.status_code == 201
            data = json.loads(response.data)
            assert data == mock_token_data
            mock_generate.assert_called_once_with('test-queue-id')
    
    def test_generate_user_token_queue_not_found(self, client):
        """Test user token generation with non-existent queue"""
        with patch('services.user_service.UserService.generate_user_token') as mock_generate:
            mock_generate.return_value = None
            
            response = client.post('/api/queues/invalid-queue/user-token')
            
            assert response.status_code == 404
            data = json.loads(response.data)
            assert data['error'] == 'Queue not found or expired'
    
    def test_create_message_success(self, client):
        """Test successful message creation"""
        mock_message_data = {
            'id': 'msg-123',
            'queue_id': 'queue-123',
            'text': 'Test message',
            'author_name': 'Test Author',
            'vote_count': 0,
            'is_read': False
        }
        
        with patch('services.message_service.MessageService.create_message') as mock_create:
            mock_create.return_value = mock_message_data
            
            response = client.post(
                '/api/queues/queue-123/messages',
                headers={'X-User-Token': 'user-token-123'},
                json={'text': 'Test message', 'author_name': 'Test Author'}
            )
            
            assert response.status_code == 201
            data = json.loads(response.data)
            assert data == mock_message_data
    
    def test_create_message_missing_token(self, client):
        """Test message creation without user token"""
        response = client.post(
            '/api/queues/queue-123/messages',
            json={'text': 'Test message'}
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['error'] == 'User token required'
    
    def test_create_message_empty_text(self, client):
        """Test message creation with empty text"""
        response = client.post(
            '/api/queues/queue-123/messages',
            headers={'X-User-Token': 'user-token-123'},
            json={'text': ''}
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['error'] == 'Message text is required'
    
    def test_get_messages_success(self, client):
        """Test successful message retrieval"""
        mock_result = {
            'messages': [{'id': 'msg-1', 'text': 'Test'}],
            'total_count': 1,
            'limit': 50,
            'offset': 0,
            'sort_by': 'newest'
        }
        
        with patch('services.message_service.MessageService.get_messages') as mock_get:
            mock_get.return_value = mock_result
            
            response = client.get('/api/queues/queue-123/messages')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data == mock_result
    
    def test_get_messages_invalid_limit(self, client):
        """Test message retrieval with invalid limit"""
        response = client.get('/api/queues/queue-123/messages?limit=200')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['error'] == 'Limit must be between 1 and 100'
    
    def test_upvote_message_success(self, client):
        """Test successful message upvote"""
        mock_message_data = {
            'id': 'msg-123',
            'vote_count': 1,
            'text': 'Test message'
        }
        
        with patch('services.message_service.MessageService.upvote_message') as mock_upvote:
            mock_upvote.return_value = mock_message_data
            
            response = client.post(
                '/api/messages/msg-123/upvote',
                headers={'X-User-Token': 'user-token-123'}
            )
            
            assert response.status_code == 201
            data = json.loads(response.data)
            assert data == mock_message_data
    
    def test_upvote_message_missing_token(self, client):
        """Test message upvote without user token"""
        response = client.post('/api/messages/msg-123/upvote')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['error'] == 'User token required'
    
    def test_delete_message_success(self, client):
        """Test successful message deletion"""
        with patch('services.message_service.MessageService.delete_message') as mock_delete:
            mock_delete.return_value = True
            
            response = client.delete(
                '/api/queues/queue-123/messages/msg-123',
                headers={'X-Queue-Secret': 'host-secret-123'}
            )
            
            assert response.status_code == 204
    
    def test_delete_message_missing_secret(self, client):
        """Test message deletion without host secret"""
        response = client.delete('/api/queues/queue-123/messages/msg-123')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert data['error'] == 'Host authentication required'