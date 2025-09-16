### **GitHub Issue: Implement Hand Raise System**

**Title:** feat: Add Real-Time Hand Raise System with Host Moderation

**Description:**

#### **Problem**

During live Q&A sessions, there is often a need for participants to verbally ask questions or contribute to the discussion, not just type them. The current system lacks a way to manage the order of speakers, leading to confusion and a less structured conversation.

#### **Proposed Solution**

Implement a new "Hand Raise" tab within the existing queue page. This system will allow audience members to virtually raise their hand, creating an ordered list for the host to manage. The host can then call on speakers, mark them as "completed,".

#### **User Stories**

- **As an Audience Member,** I want to click a "Raise Hand" button so that the host knows I wish to speak, and I can see my position in the queue.
- **As the Host,** I want to see a real-time, ordered list of everyone who has raised their hand so I can manage the flow of speakers.
- **As the Host,** I want to remove a user from the list or mark them as "completed" so I can track who has already spoken.

#### **Technical Implementation Outline**

1.  **Database Changes:**

    - Create a new `hand_raises` table.
    - Columns: `id` (UUID), `queue_id` (FK to queues), `user_token` (identifies the user), `user_name` (user's name), `raised_at` (DateTime), `completed` (Boolean, default False), `completed_at` (DateTime, nullable).
    - Indexes on `(queue_id, completed, raised_at)` for efficient querying of the active, ordered list.

2.  **New API Endpoints:**

    - `POST /api/queues/{queue_id}/handraise`: For a user to raise their hand. Checks if the user already has an active hand raise.
    - `GET /api/queues/{queue_id}/handraises`: Retrieves the list of hand raises (for host and audience views).
    - `PATCH /api/queues/{queue_id}/handraises/{handraise_id}`: Allows the host to mark a hand raise as `completed` or to remove it.

3.  **Frontend Components:**

    - A new `<HandRaiseTab />` component within the queue page.
    - **Audience View:** A button to "Raise Hand" with a mandatory name field. Once clicked, it disables and shows their position in line (e.g., "You are #3").
    - **Host View:**
      - A list of hand raises, ordered by `raised_at`.
      - Each list item shows the user's identifier (e.g., "User #123") and a "Complete" button.

4.  **Real-Time Updates:**

    - The hand raise list must update in real-time for both the host and the audience using the existing SSE connection. New events will be needed:
      - `{"event": "hand_raise_new", "data": {...}}`
      - `{"event": "hand_raise_completed", "data": {...}}`

5.  **UI/UX Considerations:**
    - The hand raise tab should have a badge indicating the number of active raises.
    - The host's list should visually distinguish between active and completed hand raises (e.g., in a separate section).
    - The timer should be prominent for the host, with clear visual warnings as time runs out.

#### **Acceptance Criteria**

- [ ] Users can raise and lower their own hand.
- [ ] The host sees an ordered, real-time list of raised hands.
- [ ] The host can mark a hand raise as completed.
- [ ] The state of the hand raise list is synchronized across all clients in real-time.
- [ ] The feature is integrated into the existing queue UI as a new tab.
