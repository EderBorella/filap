from flask import Blueprint, Response, request, current_app
from services.events import sse_manager
from config import get_config
import uuid

events_bp = Blueprint('events', __name__)

@events_bp.route('/api/queues/<queue_id>/events')
def queue_events(queue_id: str):
    """SSE endpoint for real-time queue events"""
    
    # Validate queue_id format
    try:
        uuid.UUID(queue_id)
    except ValueError:
        return {"error": "Invalid queue ID"}, 400
    
    # Get configuration for CORS headers
    config = get_config()
    
    # Get origin from request
    origin = request.headers.get('Origin', '')
    allowed_origin = '*'
    
    # Check if origin is allowed (more restrictive in production)
    if config.CORS_ORIGINS != ['*']:
        if origin in config.CORS_ORIGINS:
            allowed_origin = origin
        else:
            allowed_origin = config.CORS_ORIGINS[0] if config.CORS_ORIGINS else '*'
    
    # Create event stream
    event_stream = sse_manager.create_event_stream(queue_id)
    
    return Response(
        event_stream,
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': allowed_origin,
            'Access-Control-Allow-Headers': ','.join(config.CORS_ALLOW_HEADERS),
            'Access-Control-Allow-Credentials': 'true'
        }
    )