from flask import Blueprint, request, jsonify, Response
from services.message_service import MessageService
from services.user_service import UserService
from services.events import EventService
import json

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/api/queues/<queue_id>/user-token', methods=['POST'])
def generate_user_token(queue_id):
    """Generate a user token for a queue"""
    try:
        token_data = UserService.generate_user_token(queue_id)
        
        if token_data is None:
            return jsonify({'error': 'Queue not found or expired'}), 404
        
        return jsonify(token_data), 201
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/api/queues/<queue_id>/messages', methods=['POST'])
def create_message(queue_id):
    """Submit a new question/message to a queue"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        text = data.get('text')
        if not text or not text.strip():
            return jsonify({'error': 'Message text is required'}), 400
        
        user_token = data.get('user_token')
        if not user_token:
            return jsonify({'error': 'User token is required'}), 400
        
        author_name = data.get('author_name')
        
        message_data = MessageService.create_message(
            queue_id=queue_id,
            text=text,
            user_token=user_token,
            author_name=author_name
        )
        
        if message_data is None:
            return jsonify({'error': 'Queue not found or expired'}), 404
        
        return jsonify(message_data), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/api/queues/<queue_id>/messages', methods=['GET'])
def get_messages(queue_id):
    """Retrieve messages for a queue with pagination and sorting"""
    try:
        # Parse query parameters
        sort_by = request.args.get('sort')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        # Validate parameters
        if limit < 1 or limit > 100:
            return jsonify({'error': 'Limit must be between 1 and 100'}), 400
        
        if offset < 0:
            return jsonify({'error': 'Offset must be non-negative'}), 400
        
        result = MessageService.get_messages(
            queue_id=queue_id,
            sort_by=sort_by,
            limit=limit,
            offset=offset
        )
        
        if result is None:
            return jsonify({'error': 'Queue not found or expired'}), 404
        
        return jsonify(result), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid query parameters'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/api/queues/<queue_id>/messages/<message_id>', methods=['PATCH'])
def update_message(queue_id, message_id):
    """Update a message (host or author)"""
    try:
        # Check for host authentication first
        host_secret = request.headers.get('X-Queue-Secret')
        user_token = request.headers.get('X-User-Token')
        
        if not host_secret and not user_token:
            return jsonify({'error': 'Authentication required (host or user)'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        # Determine authentication method
        if host_secret:
            # Host authentication
            message_data = MessageService.update_message(
                queue_id=queue_id,
                message_id=message_id,
                auth_token=host_secret,
                updates=data,
                is_host=True
            )
        else:
            # User authentication (message author)
            message_data = MessageService.update_message(
                queue_id=queue_id,
                message_id=message_id,
                auth_token=user_token,
                updates=data,
                is_host=False
            )
        
        if message_data is None:
            return jsonify({'error': 'Unauthorized or message not found'}), 404
        
        return jsonify(message_data), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/api/queues/<queue_id>/messages/<message_id>', methods=['DELETE'])
def delete_message(queue_id, message_id):
    """Delete a message (host only)"""
    try:
        # Get host secret from header
        host_secret = request.headers.get('X-Queue-Secret')
        if not host_secret:
            return jsonify({'error': 'Host authentication required'}), 401
        
        success = MessageService.delete_message(
            queue_id=queue_id,
            message_id=message_id,
            host_secret=host_secret
        )
        
        if not success:
            return jsonify({'error': 'Unauthorized or message not found'}), 404
        
        return '', 204
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/api/messages/<message_id>/upvote', methods=['POST'])
def upvote_message(message_id):
    """Cast an upvote for a message"""
    try:
        # Get user token from header
        user_token = request.headers.get('X-User-Token')
        if not user_token:
            return jsonify({'error': 'User token required'}), 400
        
        message_data = MessageService.upvote_message(
            message_id=message_id,
            user_token=user_token
        )
        
        if message_data is None:
            return jsonify({'error': 'Message not found or already voted'}), 404
        
        return jsonify(message_data), 201
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/api/queues/<queue_id>/events', methods=['GET'])
def queue_events(queue_id):
    """Server-Sent Events endpoint for real-time updates"""
    def event_stream():
        # Register client for this queue
        EventService.add_client(queue_id)
        
        try:
            # Send initial connection message
            yield f"data: {json.dumps({'event': 'connected', 'queue_id': queue_id})}\n\n"
            
            # Keep connection alive and handle events
            while True:
                try:
                    # Get events for this queue (this would need to be implemented)
                    # For now, just keep the connection alive
                    yield "data: {\"event\": \"heartbeat\"}\n\n"
                    
                    # In a real implementation, you'd check for new events
                    # and yield them as they come
                    import time
                    time.sleep(30)  # Heartbeat every 30 seconds
                    
                except GeneratorExit:
                    break
                    
        finally:
            # Clean up when client disconnects
            EventService.remove_client(queue_id)
    
    return Response(
        event_stream(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        }
    )