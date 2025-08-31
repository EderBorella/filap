# Filap

A minimal app for live Q&A. Hosts create a queue, share the link, and audiences submit anonymous questions. Features upvoting and allows the host to sort questions by votes or time. Perfect for streamers and voice chats.

# Technology Stack

Category | Technology
Frontend | React 19, Vite
Backend | Python, Flask
ORM | Flask-SQLAlchemy
Development Database | SQLite
Production Database | PostgreSQL
Deployment (App) | Railway / Render
Deployment (DB) | Supabase / Railway Postgres

# Architecture

A three-tiered structure ensuring separation of concerns, where each layer has a distinct responsibility, promoting maintainability and testability.

- Route: The endpoint handler. Its job is to parse HTTP requests, validate authentication tokens, call the appropriate service method, and return HTTP responses. It contains minimal logic.
- Service: The brain of the application. This layer contains all business logic and rules (e.g., enforcing vote limits, checking queue expiration). It orchestrates interactions between models and is completely independent of HTTP concerns.
- Database: The data layer, implemented via SQLAlchemy models. Its sole responsibility is to define the data schema, handle relationships, and perform basic persistence operations (create, read, update, delete). It contains no business logic.

# Core Architecture & Features

1.  Queue & Session Management

    - Multi-Tenancy: The system supports multiple, isolated queues running simultaneously. Each queue is identified by a unique ID.
    - Host Session Persistence: Upon queue creation, a unique host token is generated and stored in the browser's localStorage, linked to the queue ID.
    - Session Expiry: This host token and its associated queue are automatically invalidated and purged from the database after 24 hours.

2.  Real-Time Updates

    - The frontend will maintain a persistent connection (e.g., using Server-Sent Events (SSE) or WebSockets) to the backend.
    - This allows the host's and audience's views to update instantly upon:
      - A new question being submitted.
      - An existing question receiving an upvote.
      - The host changing the sorting method.
      - A message is mark as read.

3.  Data Lifecycle & Cleanup

    - Automatic Purge: A dedicated background task (e.g., a cron job or a scheduled worker on Railway/Render) will run periodically to permanently delete all data (queues, questions, votes) older than 24 hours.
    - Frontend Countdown: The UI will display a countdown timer showing the time remaining until the queue is purged.

4.  Voting System

    - One Vote Per User: To prevent spam, each user (identified by a anonymous fingerprint stored in their browser's localStorage) can cast only one upvote per question.
    - Sorting: The host has a toggle to sort the question list by:
      - Most Votes: Ranks questions by the number of upvotes (descending).
      - Newest First: Ranks questions by their creation timestamp (descending).

5.  User Interface (UI) Views

    - Audience View: A simple form to submit an anonymous or identified question and a live-updating list of all questions.
    - Host View: A private view (accessed via the host token) that contains the live-updating list of questions, the sorting toggle, and administrative controls.

This architecture ensures the app is stateless, scalable for multiple sessions, self-cleaning, and provides a real-time, interactive experience.

# Queue Model (queues table):

1. Queue Model (queues table):

- id (UUID) - Public queue identifier
- name - Optional queue name
- host_secret (UUID) - Private host token
- created_at & expires_at - Automatic 24h expiry
- default_sort_order - Queue settings
- Proper indexes for performance

2. Message Model (messages table):

- id (UUID) - Message identifier
- queue_id - Foreign key to queue
- text & author_name - Message content
- vote_count - Denormalized vote counter
- created_at & updated_at - Timestamps
- is_read - Boolean - Writer or host can mark a message as read.
- Indexes on key fields

3. MessageUpvote Model (message_upvotes table):

- id (UUID) - Upvote identifier
- message_id & user_token - Voting relationship
- Unique constraint preventing duplicate votes
- Proper indexes

# API Endpoints

1. Queue Management Endpoints

   1. POST /api/queues

      - Purpose: Create a new queue.
      - Request Body: { "name": "Optional Queue Name", "default_sort_order": "newest" }
      - Response: 201 Created with the full queue object, including the generated id and crucial host_secret. The frontend must store this host_secret.

   2. GET /api/queues/{queue_id}

      - Purpose: Get the metadata and settings for a queue (e.g., to display its name and settings on the page).
      - Authentication: None (public information).
      - Response: 200 OK with { "id": "...", "name": "...", "default_sort_order": "newest", "expires_at": "..." }

   3. PATCH /api/queues/{queue_id}

      - Purpose: Update queue settings (e.g., changing the default sort order for everyone).
      - Authentication: Host only (via host_secret in a header like X-Queue-Secret).
      - Request Body: { "default_sort_order": "votes" }
      - Response: 200 OK with the updated queue object. This action should likely trigger a real-time update to all connected clients.

2. Message Management Endpoints

   1. POST /api/queues/{queue_id}/messages

      - Purpose: Submit a new question/message to a queue.
      - Authentication: None.
      - Request Body: { "text": "My question?", "author_name": "John" } (author_name is optional)
      - Response: 201 Created with the message object. This action triggers a real-time update.

   2. GET /api/queues/{queue_id}/messages

      - Purpose: Retrieve messages for a queue, with pagination and sorting.
      - Authentication: None.
      - Query Parameters:
        - ?sort=newest or ?sort=votes (overrides the queue's default)
        - ?limit=50 (pagination limit)
        - ?offset=0 (pagination offset)
      - Response: 200 OK with { "messages": [...], "total_count": 120 }

   3. PATCH /api/queues/{queue_id}/messages/{message_id}

      - Purpose: Update a message. Primarily used to toggle the is_read status. Could also be used for host editing (e.g., to moderate language without deleting).
      - Authentication: Host only (for is_read) or Message author (if implemented via a one-time token, for them to mark their own question as read).
      - Request Body: { "is_read": true }
      - Response: 200 OK. Triggers a real-time update.

   4. DELETE /api/queues/{queue_id}/messages/{message_id}

      - Purpose: Host deletes a message for moderation.
      - Authentication: Host only.
      - Response: 204 No Content. Triggers a real-time update.

3. Voting Endpoint

   1. POST /api/messages/{message_id}/upvote

      - Purpose: Cast an upvote for a message. The server checks the user_token to enforce one vote per person.
      - Authentication: The user_token must be sent in a header (e.g., user_token). This is not a secret but an anonymous identifier.
      - Request Body: None, or { "action": "add" } if you want one endpoint to also handle un-upvoting.
      - Response: 201 Created. Returns the updated message object with the new vote_count. Triggers a real-time update.

4. Real-Time Updates

   1. GET /api/queues/{queue_id}/events

      - Purpose: This is the endpoint for Server-Sent Events (SSE) or WebSockets. Clients (both host and audience) connect to this endpoint to receive a live stream of events.
      - Events: The server will push messages like:
        - {"event": "new_message", "data": {...}}
        - {"event": "message_updated", "data": {...}}
        - {"event": "message_deleted", "data": {"id": "..."}}
        - {"event": "queue_updated", "data": {...}} (e.g., sort order changed)

# Improvements:

- Atomic Update: The most efficient way is to never read the value to update it. Perform the update in a single, atomic SQL operation.
- The host_secret should never be part of the URL. The frontend should store it in memory after the host "logs in" (by entering it on a separate page or via the initial creation flow). The secret should then be sent in a special HTTP header (e.g., X-Queue-Secret) with every privileged request. This prevents it from being accidentally logged by browsers or shared via copy-paste of the main URL.
- Separate the models in different files.
- Change the app to have a user_permissions table. So we can have granularity in authorisation.
