#!/usr/bin/env python3
"""
Simple test runner script for the Filap API
"""

import subprocess
import sys

def run_command(command, description):
    """Run a command and return success/failure"""
    print(f"\n[TEST] {description}")
    print(f"Running: {command}")
    print("-" * 50)
    
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
            
        if result.returncode == 0:
            print(f"[PASS] {description} - PASSED")
            return True
        else:
            print(f"[FAIL] {description} - FAILED")
            return False
    except Exception as e:
        print(f"[ERROR] {description} - ERROR: {e}")
        return False

def main():
    print("FILAP API TEST SUITE")
    print("=" * 50)
    
    # List of tests to run
    tests = [
        ("python -m pytest tests/test_events.py -v --no-cov", "SSE/Events System Tests"),
        ("python -m pytest tests/test_queue_service.py -v --no-cov", "Queue Service Tests"),
        ("python -m pytest tests/test_message_service.py -v --no-cov", "Message Service Tests"),
        ("python utils/demo.py", "Real-time Events Demo"),
        ("python -c \"from config import get_config; print('[OK] Config system working')\"", "Configuration System"),
        ("python -c \"from services.queue_service import QueueService; print('[OK] Queue service working')\"", "Queue Service Import"),
        ("python -c \"from services.message_service import MessageService; print('[OK] Message service working')\"", "Message Service Import"),
        ("python -c \"from services.user_service import UserService; print('[OK] User service working')\"", "User Service Import"),
    ]
    
    results = []
    
    for command, description in tests:
        success = run_command(command, description)
        results.append((description, success))
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for description, success in results:
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} - {description}")
        if success:
            passed += 1
        else:
            failed += 1
    
    print("-" * 50)
    print(f"Total: {passed + failed} | Passed: {passed} | Failed: {failed}")
    
    if failed == 0:
        print("SUCCESS: All tests passed! System is ready to go!")
        return 0
    else:
        print("WARNING: Some tests failed. Check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())