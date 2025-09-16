# Timer System Specification

## 1. Overview

The Timer System provides hosts with control over speaking time allocation during live sessions. Integrated with the Hand Raise feature, it allows hosts to manage participant speaking time with start/stop/complete functionality and visual countdown displays for all users.

## 2. Database Modifications

### 2.1. Queue Table Additions

- **timer_minutes**: INTEGER
  - Default speaking time allocation in minutes
  - Default value: 3 minutes
  - Configurable by host per queue

### 2.2. Hand Raise Table Additions

- **timer_status**: SMALLINT (Nullable)
  - Enumeration values: 0 (Stopped), 1 (Running), 2 (Completed)
  - NULL indicates timer never started
- **timer_started_at**: TIMESTAMP (Nullable)
  - Timestamp when timer was last started
- **timer_remaining_seconds**: INTEGER (Nullable)
  - Remaining seconds when timer is stopped/paused
  - NULL indicates fresh state

## 3. API Endpoints

### 3.1. Timer Control Endpoint

**POST** `/api/queues/{queue_id}/handraises/{handraise_id}/timer`

#### Actions:

- **start**: Initialize timer with queue's default time
- **stop**: Pause timer and store remaining time
- **restart**: Reset timer to initial duration
- **complete**: Mark timer as finished

#### Response:

```json
{
  "remaining_seconds": 120,
  "timer_status": "running",
  "total_seconds": 120
}
```

### 3.2. Timer Completion Endpoint

**POST** `/api/queues/{queue_id}/handraises/{handraise_id}/timer/complete`

- Manually mark timer as completed
- Updates database status
- Triggers completion event

## 4. Real-Time Events

### 4.1. Event Types

- **timer_started**: Initial timer activation
- **timer_stopped**: Timer paused by host
- **timer_updated**: Periodic progress updates (optional)
- **timer_completed**: Natural or manual completion

### 4.2. Event Payload

All timer events include:

- handraise_id
- remaining_seconds
- timer_status
- total_seconds

## 5. Frontend Responsibilities

### 5.1. State Management

- Maintain local timer state synchronized with backend
- Handle automatic countdown progression for running timers
- Manage UI states based on timer status

### 5.2. User Interface Components

- Visual countdown display for all participants
- Host control buttons (start/stop/complete)
- Status indicators for different timer states
- Time allocation configuration interface

### 5.3. Event Handling

- Subscribe to timer-related SSE events
- Update local state based on real-time events
- Provide visual feedback for state changes

## 6. System Behavior

### 6.1. Timer Progression

- Frontend handles countdown animation for better responsiveness
- Backend maintains authoritative time remaining
- Regular synchronization between frontend and backend

### 6.2. Status Transitions

- **start → running**: Initializes timing
- **running → stopped**: Preserves remaining time
- **stopped → running**: Resumes from saved time
- **any → complete**: Finalizes timing session

### 6.3. Error Conditions

- Network disruption handling
- State reconciliation after reconnection
- Conflict resolution for concurrent operations
-

## 7. Integration Points

### 7.1. Hand Raise System

- Timer associated with specific hand raise instances
- Automatic completion when hand raise is marked done
- Shared real-time communication channel
- Completed rise hands shouldn't display the timer.
- The host should be able to run the timer how many times they want. For the same hand rised.
- The timer should allow the host to change timer duration, but that won't impact running timers.

### 7.2. Host Controls

- Timer management integrated with hand raise moderation
- Unified interface for speaking time management
- Consistent permission model

This specification provides a complete foundation for implementing the timer functionality while maintaining consistency with the existing architecture and design patterns.
