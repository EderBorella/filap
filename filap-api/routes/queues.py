from flask import Blueprint, request, jsonify
from services.queue_service import QueueService
from utils.auth import require_host_auth, validate_queue_exists
import logging

# Configure logging
logger = logging.getLogger(__name__)

queues_bp = Blueprint('queues', __name__)

@queues_bp.route('/api/queues', methods=['POST'])
def create_queue():
    """
    Create a new queue
    
    Request Body:
    {
        "name": "Optional Queue Name",
        "default_sort_order": "newest" | "votes"
    }
    
    Returns:
        201: Queue created successfully with full queue object including host_secret
        400: Invalid request data
    """
    try:
        data = request.get_json() or {}
        
        # Extract and validate parameters
        name = data.get('name')
        default_sort_order = data.get('default_sort_order', 'votes')
        
        # Validate name length if provided
        if name is not None:
            if not isinstance(name, str):
                return {"error": "Name must be a string"}, 400
            if len(name.strip()) == 0:
                name = None  # Empty string becomes None
            elif len(name) > 255:
                return {"error": "Name must be 255 characters or less"}, 400
            else:
                name = name.strip()
        
        # Create queue
        queue_data = QueueService.create_queue(
            name=name,
            default_sort_order=default_sort_order
        )
        
        logger.info(f"Created queue {queue_data['id']} with name '{name}'")
        
        return queue_data, 201
        
    except ValueError as e:
        return {"error": str(e)}, 400
    except Exception as e:
        logger.error(f"Error creating queue: {str(e)}")
        return {"error": "Internal server error"}, 500

@queues_bp.route('/api/queues/<queue_id>', methods=['GET'])
def get_queue(queue_id: str):
    """
    Get queue metadata and settings
    
    Returns:
        200: Queue data (public information only)
        404: Queue not found or expired
    """
    try:
        queue_data = QueueService.get_queue(queue_id)
        
        if not queue_data:
            return {"error": "Queue not found or expired"}, 404
        
        return queue_data, 200
        
    except Exception as e:
        logger.error(f"Error getting queue {queue_id}: {str(e)}")
        return {"error": "Internal server error"}, 500

@queues_bp.route('/api/queues/<queue_id>', methods=['PATCH'])
@require_host_auth
def update_queue(queue_id: str, host_secret: str):
    """
    Update queue settings (host only)
    
    Headers:
        X-Queue-Secret: Host authentication secret
    
    Request Body:
    {
        "name": "Updated Queue Name",
        "default_sort_order": "newest" | "votes"
    }
    
    Returns:
        200: Queue updated successfully
        400: Invalid request data
        401: Missing host secret
        403: Invalid host credentials
        404: Queue not found
    """
    try:
        data = request.get_json() or {}
        
        # Validate updates
        updates = {}
        
        if 'name' in data:
            name = data['name']
            if name is not None:
                if not isinstance(name, str):
                    return {"error": "Name must be a string"}, 400
                if len(name.strip()) == 0:
                    updates['name'] = None
                elif len(name) > 255:
                    return {"error": "Name must be 255 characters or less"}, 400
                else:
                    updates['name'] = name.strip()
            else:
                updates['name'] = None
        
        if 'default_sort_order' in data:
            updates['default_sort_order'] = data['default_sort_order']
        
        if not updates:
            return {"error": "No valid updates provided"}, 400
        
        # Update queue
        queue_data = QueueService.update_queue(queue_id, host_secret, updates)
        
        if not queue_data:
            return {"error": "Queue not found or expired"}, 404
        
        logger.info(f"Updated queue {queue_id}: {updates}")
        
        return queue_data, 200
        
    except ValueError as e:
        return {"error": str(e)}, 400
    except Exception as e:
        logger.error(f"Error updating queue {queue_id}: {str(e)}")
        return {"error": "Internal server error"}, 500

@queues_bp.route('/api/system/stats', methods=['GET'])
def get_system_stats():
    """
    Get system-wide statistics
    
    Returns:
        200: System statistics
    """
    try:
        stats = QueueService.get_queue_stats()
        return stats, 200
        
    except Exception as e:
        logger.error(f"Error getting system stats: {str(e)}")
        return {"error": "Internal server error"}, 500

@queues_bp.route('/api/system/cleanup', methods=['POST'])
def cleanup_expired_queues():
    """
    Manually trigger cleanup of expired queues
    (Typically called by background tasks)
    
    Returns:
        200: Cleanup completed with count of cleaned queues
    """
    try:
        count = QueueService.cleanup_expired_queues()
        
        logger.info(f"Cleaned up {count} expired queues")
        
        return {
            "message": "Cleanup completed",
            "cleaned_queues": count
        }, 200
        
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return {"error": "Internal server error"}, 500

# Error handlers for the blueprint
@queues_bp.errorhandler(404)
def not_found(error):
    return {"error": "Queue not found"}, 404

@queues_bp.errorhandler(500)
def internal_error(error):
    return {"error": "Internal server error"}, 500