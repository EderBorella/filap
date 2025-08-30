"""
Demo utility showing how easy it is to trigger real-time updates
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.events import EventService
import uuid

def demo_real_time_events():
    """Demonstrate how easy it is to trigger real-time updates"""
    
    # Example queue and message data
    queue_id = str(uuid.uuid4())
    message_data = {
        "id": str(uuid.uuid4()),
        "text": "This is a new question!",
        "author_name": "John Doe",
        "vote_count": 0,
        "is_read": False,
        "created_at": "2025-08-30T16:43:00Z"
    }
    
    print("DEMO: Broadcasting real-time events is super easy!")
    print(f"Queue ID: {queue_id}")
    print()
    
    # 1. New message - just call one method!
    print("1. New message submitted:")
    EventService.broadcast_new_message(queue_id, message_data)
    print(f"   -> EventService.broadcast_new_message('{queue_id}', message_data)")
    print()
    
    # 2. Message updated (vote count changed)
    print("2. Message upvoted:")
    message_data["vote_count"] = 5
    EventService.broadcast_message_updated(queue_id, message_data)
    print(f"   -> EventService.broadcast_message_updated('{queue_id}', updated_data)")
    print()
    
    # 3. Message marked as read
    print("3. Message marked as read:")
    message_data["is_read"] = True
    EventService.broadcast_message_updated(queue_id, message_data)
    print(f"   -> EventService.broadcast_message_updated('{queue_id}', updated_data)")
    print()
    
    # 4. Message deleted
    print("4. Message deleted:")
    EventService.broadcast_message_deleted(queue_id, message_data["id"])
    print(f"   -> EventService.broadcast_message_deleted('{queue_id}', '{message_data['id']}')")
    print()
    
    # 5. Queue settings updated
    print("5. Queue settings changed:")
    queue_data = {
        "id": queue_id,
        "name": "Updated Queue Name",
        "default_sort_order": "votes"
    }
    EventService.broadcast_queue_updated(queue_id, queue_data)
    print(f"   -> EventService.broadcast_queue_updated('{queue_id}', queue_data)")
    print()
    
    print("SUCCESS: That's it! Super simple to trigger real-time updates anywhere in your code!")

if __name__ == "__main__":
    demo_real_time_events()