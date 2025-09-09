from flask import Blueprint, request, jsonify, Response
from services.message_service import MessageService
from services.user_service import UserService
from services.events import EventService
import json

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/api/queues/<queue_id>/user-token', methods=['POST'])
def generate_user_token(queue_id):
    """Generate a user token for a queue
    ---
    tags:
      - User Tokens
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
    responses:
      201:
        description: User token generated successfully
        schema:
          type: object
          properties:
            user_token:
              type: string
              format: uuid
              description: Generated user token
            queue_id:
              type: string
              format: uuid
              description: Queue identifier
            expires_at:
              type: string
              format: date-time
              description: Token expiration time
      404:
        description: Queue not found or expired
        schema:
          type: object
          properties:
            error:
              type: string
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        token_data = UserService.generate_user_token(queue_id)
        
        if token_data is None:
            return jsonify({'error': 'Queue not found or expired'}), 404
        
        return jsonify(token_data), 201
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/api/queues/<queue_id>/messages', methods=['POST'])
def create_message(queue_id):
    """Submit a new question/message to a queue
    ---
    tags:
      - Messages
    consumes:
      - application/json
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - text
            - user_token
          properties:
            text:
              type: string
              minLength: 1
              maxLength: 2000
              description: Message content (1-2000 characters)
            user_token:
              type: string
              format: uuid
              description: User token for identification
            author_name:
              type: string
              maxLength: 100
              description: Optional author name (max 100 characters)
    responses:
      201:
        description: Message created successfully
        schema:
          type: object
          properties:
            id:
              type: string
              format: uuid
            queue_id:
              type: string
              format: uuid
            text:
              type: string
            author_name:
              type: string
            user_token:
              type: string
              format: uuid
            vote_count:
              type: integer
              default: 0
            is_read:
              type: boolean
              default: false
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time
      400:
        description: Invalid request data
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Queue not found or expired
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        # Get user token from header (consistent with other endpoints)        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        text = data.get('text')
        if not text or not text.strip():
            return jsonify({'error': 'Message text is required'}), 400
        
        user_token = data.get('user_token')
        if not user_token:
            return jsonify({'error': 'User token required'}), 400
        
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
    """Retrieve messages for a queue with pagination and sorting
    ---
    tags:
      - Messages
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
      - in: query
        name: sort
        type: string
        enum: [votes, newest]
        description: Sort order (overrides queue default)
      - in: query
        name: limit
        type: integer
        minimum: 1
        maximum: 100
        default: 50
        description: Number of messages to return
      - in: query
        name: offset
        type: integer
        minimum: 0
        default: 0
        description: Number of messages to skip for pagination
    responses:
      200:
        description: Messages retrieved successfully
        schema:
          type: object
          properties:
            messages:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                    format: uuid
                  queue_id:
                    type: string
                    format: uuid
                  text:
                    type: string
                  author_name:
                    type: string
                  user_token:
                    type: string
                    format: uuid
                  vote_count:
                    type: integer
                  is_read:
                    type: boolean
                  created_at:
                    type: string
                    format: date-time
                  updated_at:
                    type: string
                    format: date-time
            total_count:
              type: integer
              description: Total number of messages in queue
            limit:
              type: integer
              description: Applied limit
            offset:
              type: integer
              description: Applied offset
            sort_by:
              type: string
              description: Applied sort order
      400:
        description: Invalid query parameters
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Queue not found or expired
        schema:
          type: object
          properties:
            error:
              type: string
    """
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
        
        # Get user token from header (optional for vote status)
        user_token = request.headers.get('X-User-Token')
        
        result = MessageService.get_messages(
            queue_id=queue_id,
            user_token=user_token,
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
    """Update a message (host or author)
    ---
    tags:
      - Messages
    consumes:
      - application/json
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
      - in: path
        name: message_id
        type: string
        format: uuid
        required: true
        description: Message identifier
      - in: header
        name: X-Queue-Secret
        type: string
        format: uuid
        description: Host authentication secret (for host access)
      - in: header
        name: X-User-Token
        type: string
        format: uuid
        description: User token (for author access)
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            is_read:
              type: boolean
              description: Mark message as read/unread
    responses:
      200:
        description: Message updated successfully
        schema:
          type: object
          properties:
            id:
              type: string
              format: uuid
            queue_id:
              type: string
              format: uuid
            text:
              type: string
            author_name:
              type: string
            user_token:
              type: string
              format: uuid
            vote_count:
              type: integer
            is_read:
              type: boolean
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time
      400:
        description: Invalid request data
        schema:
          type: object
          properties:
            error:
              type: string
      401:
        description: Authentication required
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Unauthorized or message not found
        schema:
          type: object
          properties:
            error:
              type: string
    security:
      - HostSecret: []
      - UserToken: []
    """
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
    """Delete a message (host only)
    ---
    tags:
      - Messages
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
      - in: path
        name: message_id
        type: string
        format: uuid
        required: true
        description: Message identifier
      - in: header
        name: X-Queue-Secret
        type: string
        format: uuid
        required: true
        description: Host authentication secret
    responses:
      204:
        description: Message deleted successfully
      401:
        description: Host authentication required
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Unauthorized or message not found
        schema:
          type: object
          properties:
            error:
              type: string
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
    security:
      - HostSecret: []
    """
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
    """Toggle upvote for a message (add vote if not voted, remove if already voted)
    ---
    tags:
      - Voting
    parameters:
      - in: path
        name: message_id
        type: string
        format: uuid
        required: true
        description: Message identifier
      - in: header
        name: X-User-Token
        type: string
        format: uuid
        required: true
        description: User token for vote tracking
    responses:
      201:
        description: Vote toggled successfully
        schema:
          type: object
          properties:
            id:
              type: string
              format: uuid
            queue_id:
              type: string
              format: uuid
            text:
              type: string
            author_name:
              type: string
            user_token:
              type: string
              format: uuid
            vote_count:
              type: integer
              description: Updated vote count
            is_read:
              type: boolean
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time
      400:
        description: User token required
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Message not found
        schema:
          type: object
          properties:
            error:
              type: string
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
    security:
      - UserToken: []
    """
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
            return jsonify({'error': 'Message not found'}), 404
        
        return jsonify(message_data), 201
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/api/queues/<queue_id>/events', methods=['GET'])
def queue_events(queue_id):
    """Server-Sent Events endpoint for real-time updates
    ---
    tags:
      - Real-time Events
    produces:
      - text/event-stream
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
    responses:
      200:
        description: SSE stream for real-time updates
        schema:
          type: string
          description: Event stream with messages like new_message, message_updated, message_deleted, queue_updated
        headers:
          Cache-Control:
            type: string
            default: no-cache
          Connection:
            type: string
            default: keep-alive
          Access-Control-Allow-Origin:
            type: string
            default: "*"
      404:
        description: Queue not found or expired
        schema:
          type: object
          properties:
            error:
              type: string
    """
    from services.events import sse_manager
    from services.queue_service import QueueService
    
    # Validate queue exists before setting up SSE connection
    queue_data = QueueService.get_queue(queue_id)
    if not queue_data:
        return jsonify({'error': 'Queue not found or expired'}), 404
    
    # Create SSE event stream using our SSEManager
    event_stream = sse_manager.create_event_stream(queue_id)
    
    return Response(
        event_stream,
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        }
    )
