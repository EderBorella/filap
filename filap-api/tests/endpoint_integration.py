import subprocess
import time
import requests
import sys
import os

# --- Configuration ---
# Adjust these paths and settings to match your project structure.
API_BASE_URL = "http://127.0.0.1:5000"
API_ROOT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Go up one level from /tests
VENV_PYTHON = os.path.join(API_ROOT_PATH, ".venv", "Scripts", "python.exe")
FLASK_APP_FILE = "app.py"  # Your main Flask application file

def test_endpoint(method, endpoint, expected_status, json_data=None, headers=None):
    """
    Generic function to test an endpoint.
    
    On success (status code matches expected_status), it returns the response object.
    On failure, it returns None.
    """
    url = f"{API_BASE_URL}{endpoint}"
    print(f"Testing {method} {url}... ", end="")
    try:
        response = requests.request(method, url, json=json_data, headers=headers, timeout=10)
        if response.status_code == expected_status:
            print(f"PASSED (Status: {response.status_code})")
            return response
        else:
            print(f"FAILED (Status: {response.status_code}, Expected: {expected_status})")
            print(f"      Response: {response.text[:150]}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"FAILED (Error: {e})")
        return None


def run_all_tests():
    """
    Runs a sequence of integration tests for all defined endpoints based on api_spec.yml.
    """
    print("\n--- Running Full API Lifecycle Test ---")

    # === 1. Queue Lifecycle ===
    print("\n--- Testing Queue Lifecycle ---")

    # POST /api/queues (Create)
    queue_payload = {"name": f"Test Queue {time.time()}"}
    post_queue_resp = test_endpoint("POST", "/api/queues", 201, json_data=queue_payload)
    if not post_queue_resp:
        print("❌ Critical test failed: POST /api/queues. Aborting.")
        return False

    try:
        queue_data = post_queue_resp.json()
        queue_id = queue_data.get('id')
        host_secret = queue_data.get('host_secret')
        if not all([queue_id, host_secret]):
            print("❌ Test setup failed: Queue ID or Host Secret missing from response.")
            return False
        print(f"--> Created Queue ID: {queue_id}")
    except (requests.exceptions.JSONDecodeError, AttributeError):
        print("❌ Test setup failed: Could not parse JSON from POST /api/queues response.")
        return False

    host_headers = {"X-Queue-Secret": host_secret}

    # PATCH /api/queues/{id} (Update)
    patch_payload = {"name": "Updated Test Queue Name"}
    if not test_endpoint("PATCH", f"/api/queues/{queue_id}", 200, json_data=patch_payload, headers=host_headers): return False

    # GET /api/queues/{id} (Read) - Verify update
    get_queue_resp = test_endpoint("GET", f"/api/queues/{queue_id}", 200)
    if get_queue_resp:
        updated_name = get_queue_resp.json().get('name')
        if updated_name == patch_payload["name"]:
            print("--> PASSED: Queue name updated successfully.")
        else:
            print(f"--> FAILED: Queue name mismatch. Expected '{patch_payload['name']}', got '{updated_name}'")
            return False
    else:
        return False

    # === 2. User Token and Message Lifecycle ===
    print("\n--- Testing User Token and Message Lifecycle ---")

    # POST /api/queues/{id}/user-token (Generate tokens)
    user1_token_resp = test_endpoint("POST", f"/api/queues/{queue_id}/user-token", 201)
    user2_token_resp = test_endpoint("POST", f"/api/queues/{queue_id}/user-token", 201)
    if not all([user1_token_resp, user2_token_resp]):
        print("❌ Critical test failed: Could not generate user tokens. Aborting.")
        return False

    user1_token = user1_token_resp.json().get('user_token')
    user2_token = user2_token_resp.json().get('user_token')
    user1_headers = {"X-User-Token": user1_token}
    user2_headers = {"X-User-Token": user2_token}
    print(f"--> Generated User Token 1: ...{user1_token[-4:]}")
    print(f"--> Generated User Token 2: ...{user2_token[-4:]}")

    # POST /api/queues/{id}/messages (Create)
    message_payload = {"text": "This is a test message.", "user_token": user1_token}
    post_msg_resp = test_endpoint("POST", f"/api/queues/{queue_id}/messages", 201, json_data=message_payload)
    if not post_msg_resp:
        print("❌ Critical test failed: POST /api/queues/{id}/messages. Aborting.")
        return False

    message_id = post_msg_resp.json().get('id')
    print(f"--> Created Message ID: {message_id}")

    # GET /api/queues/{id}/messages (List) - Verify creation
    list_msg_resp = test_endpoint("GET", f"/api/queues/{queue_id}/messages", 200)
    if list_msg_resp:
        messages = list_msg_resp.json().get('messages', [])
        if not any(msg.get('id') == message_id for msg in messages):
            print("--> FAILED: Created message not found in list.")
            return False
        print("--> PASSED: Found created message in list.")
    else:
        return False

    # === 3. Voting Lifecycle ===
    print("\n--- Testing Voting Lifecycle ---")

    # POST /api/messages/{id}/upvote (User 1 - First vote)
    upvote_resp1 = test_endpoint("POST", f"/api/messages/{message_id}/upvote", 201, headers=user1_headers)
    if not upvote_resp1: return False
    if upvote_resp1.json().get('vote_count') != 1:
        print("--> FAILED: Vote count should be 1 after first upvote.")
        return False

    # POST /api/messages/{id}/upvote (User 1 - Duplicate vote, should fail with 404 per spec)
    if not test_endpoint("POST", f"/api/messages/{message_id}/upvote", 404, headers=user1_headers): return False

    # POST /api/messages/{id}/upvote (User 2 - Second vote)
    upvote_resp2 = test_endpoint("POST", f"/api/messages/{message_id}/upvote", 201, headers=user2_headers)
    if not upvote_resp2: return False
    if upvote_resp2.json().get('vote_count') != 2:
        print("--> FAILED: Vote count should be 2 after second upvote.")
        return False
    print("--> PASSED: Voting logic appears correct.")

    # === 4. Message Update & Deletion (Host-only) ===
    print("\n--- Testing Message Update & Deletion (Host) ---")

    # PATCH /api/queues/{id}/messages/{id} (Update is_read)
    patch_msg_payload = {"is_read": True}
    patch_msg_resp = test_endpoint("PATCH", f"/api/queues/{queue_id}/messages/{message_id}", 200, json_data=patch_msg_payload, headers=host_headers)
    if not patch_msg_resp: return False
    if not patch_msg_resp.json().get('is_read'):
        print("--> FAILED: Message was not marked as read after PATCH.")
        return False
    print("--> PASSED: Message updated successfully by host.")

    # DELETE /api/queues/{id}/messages/{id} (Delete)
    if not test_endpoint("DELETE", f"/api/queues/{queue_id}/messages/{message_id}", 204, headers=host_headers):
        return False

    # GET /api/queues/{id}/messages (List) - Verify deletion
    list_after_del_resp = test_endpoint("GET", f"/api/queues/{queue_id}/messages", 200)
    if list_after_del_resp:
        messages = list_after_del_resp.json().get('messages', [])
        if any(msg.get('id') == message_id for msg in messages):
            print("--> FAILED: Deleted message still found in list.")
            return False
        print("--> PASSED: Deleted message was not found in list.")
    else:
        return False

    # === 5. SSE Endpoint ===
    print("\n--- Testing SSE Endpoint ---")
    if not test_endpoint("GET", f"/api/queues/{queue_id}/events", 200, headers={'Accept': 'text/event-stream'}):
        return False

    print("\n--- All Tests Finished ---")
    return True

def main():
    """Starts the server, runs tests, and stops the server."""
    flask_env = os.environ.copy()
    flask_env["FLASK_APP"] = FLASK_APP_FILE
    flask_env["FLASK_ENV"] = "development"

    command = [VENV_PYTHON, "-m", "flask", "run"]
    server_process = None
    success = False

    try:
        print(f"Starting Flask server from: {API_ROOT_PATH}")
        server_process = subprocess.Popen(
            command,
            cwd=API_ROOT_PATH,
            env=flask_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        print("Waiting for server to start (5s)...")
        time.sleep(5)

        if server_process.poll() is not None:
            print("!!! Server failed to start. Aborting tests. !!!")
            print("Server output:")
            for line in server_process.stdout:
                print(line.strip())
            sys.exit(1)
        
        print("Server seems to be running.")
        success = run_all_tests()

    finally:
        if server_process:
            print("Shutting down Flask server...")
            # Terminate the process and capture any output to show on failure
            server_process.terminate()
            try:
                stdout, _ = server_process.communicate(timeout=5) # Read output and wait for process to end
                print("Server shut down.")
                if not success and stdout:
                    print("\n" + "="*20 + " Server Log " + "="*20)
                    print("The server encountered an error. Here is its output, which should contain a traceback:")
                    print(stdout.strip())
                    print("="*52 + "\n")
            except subprocess.TimeoutExpired:
                print("Server did not shut down gracefully. Killing process.")
                server_process.kill()

    if success:
        print("✅ All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()

