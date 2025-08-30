from flask import request
from functools import wraps
from typing import Optional, Tuple
from services.queue_service import QueueService

def extract_host_secret() -> Optional[str]:
    """
    Extract host secret from request headers
    
    Returns:
        Host secret string or None if not present
    """
    return request.headers.get('X-Queue-Secret')

def extract_voter_token() -> Optional[str]:
    """
    Extract voter token from request headers
    
    Returns:
        Voter token string or None if not present
    """
    return request.headers.get('Voter-Token')

def require_host_auth(f):
    """
    Decorator to require host authentication for queue operations
    
    The decorated function must take queue_id as first parameter after self.
    Adds host_secret parameter to the function call.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Extract queue_id from route parameters
        queue_id = kwargs.get('queue_id')
        if not queue_id:
            return {"error": "Queue ID required"}, 400
        
        # Extract host secret from headers
        host_secret = extract_host_secret()
        if not host_secret:
            return {"error": "X-Queue-Secret header required"}, 401
        
        # Verify host access
        if not QueueService.verify_host_access(queue_id, host_secret):
            return {"error": "Invalid host credentials or queue not found"}, 403
        
        # Add host_secret to kwargs for the decorated function
        kwargs['host_secret'] = host_secret
        return f(*args, **kwargs)
    
    return decorated_function

def require_voter_token(f):
    """
    Decorator to require voter token for voting operations
    
    Adds voter_token parameter to the function call.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Extract voter token from headers
        voter_token = extract_voter_token()
        if not voter_token:
            return {"error": "Voter-Token header required"}, 400
        
        # Add voter_token to kwargs for the decorated function
        kwargs['voter_token'] = voter_token
        return f(*args, **kwargs)
    
    return decorated_function

def validate_queue_exists(f):
    """
    Decorator to validate that a queue exists and is not expired
    
    The decorated function must take queue_id as first parameter.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Extract queue_id from route parameters
        queue_id = kwargs.get('queue_id')
        if not queue_id:
            return {"error": "Queue ID required"}, 400
        
        # Check if queue exists and is not expired
        queue_data = QueueService.get_queue(queue_id)
        if not queue_data:
            return {"error": "Queue not found or expired"}, 404
        
        # Add queue_data to kwargs for optimization
        kwargs['queue_data'] = queue_data
        return f(*args, **kwargs)
    
    return decorated_function