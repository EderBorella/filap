# Frontend Design Guidelines

# Design Philosophy

The Filap frontend follows a modern, minimalistic design approach focused on usability and clarity. The interface should feel lightweight, responsive, and purpose-built for live Q&A sessions. The design uses soft lines, generous spacing, and a calming color palette to create an accessible and professional experience.

# Visual Style

1.  Color Palette

    - Role | Hex | Usage
    - Primary | #4F46E5 | Main buttons, active states, important accents
    - Primary Hover | #4338CA | Hover state for primary actions
    - Secondary | #6B7280 | Secondary text, inactive states
    - Background | #F9FAFB | Main page background
    - Surface | #FFFFFF | Cards, containers, modals
    - Success | #10B981 | Positive actions, confirmation states
    - Error | #EF4444| Errors, warnings, destructive actions

2.  Typography

- Font Family: System UI stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Font Weights: Regular (400), Medium (500), Semibold (600)
- Heading Sizes: - h1: 2.5rem (40px) - h2: 2rem (32px) - h3: 1.5rem (24px)
- Body Text: 1rem (16px) with 1.5 line height

3. Spacing & Layout

   - Base Unit: 4px
   - Container Padding: 24px (6 units)
   - Section Margins: 32px (8 units) between major sections
   - Border Radius:
     - Small: 4px (1 unit) - input fields, small elements
     - Medium: 8px (2 units) - cards, containers
     - Large: 12px (3 units) - buttons, prominent elements

4. Shadows

   - Small: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
   - Medium: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
   - Large: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)

# Page Structure

1. Home

   - Navigation Bar

     - Position: Fixed top with slight background blur (backdrop-filter: blur(8px))
     - Background: rgba(255, 255, 255, 0.8)
     - Height: 64px
     - Content:
       - Left: Brand logo/name "Filap" (font-weight: 600, font-size: 1.25rem)
       - Center: Navigation links (Home, My Queues, Contact)
       - Right: (Optional) Theme toggle or settings icon

   - Hero Section

     - Layout: Centered, max-width: 640px
     - Vertical spacing: 96px top margin (below nav), 64px bottom margin
     - Content:
       Title: "Filap" (h1, centered, font-weight: 600)
       Subtitle: "The lightweight Q&A platform for live audiences. Ask questions, vote for your favorites, no sign-up required." (centered, secondary color)
       Spacing: 32px between title and subtitle

   - Action Section

     - Layout: Two-column layout on desktop, stacked on mobile
     - Spacing: 48px between primary and secondary action areas

   - Primary Action

     - Button: "Create a Queue" (primary style, large)
       - Size: 56px height, 48px padding horizontal
       - Font: Medium weight, 1.125rem size
       - Background: Primary color gradient (from #4F46E5 to #7C3AED)
       - Hover effect: slight scale transform (1.02) and shadow elevation
       - Action: Calls POST /api/queues, redirects to /queue/<id>/host/<secret>

   - Secondary Action

     - Container: Card with medium shadow and border radius
     - Title: "Have a code? Join a queue" (h3, centered)
     - Input Group:
       - Input field: 48px height, medium border radius, placeholder "Paste Queue ID here..."
       - Button: "Join" (secondary style, same height as input)
       - Validation: Real-time UUID format checking, button disabled until valid
       - Action: Redirects to /queue/<queue_id>

   - Footer

     - Position: Bottom of page, centered
     - Padding: 32px vertical
     - Content:
       - © {currentYear} Developer Name
       - Icon links to GitHub and LinkedIn (24px icons, secondary color)
       - Optional: Link to API documentation

   - Component Implementation Notes

     - Buttons: Use CSS transitions for hover states (transform, box-shadow, background-color)
     - Input Fields: Add focus states with primary color border
     - Responsive Design: Use mobile-first CSS with breakpoints at 640px, 768px, 1024px
     - Icons: Use Heroicons or similar icon library with consistent 24px size
     - Loading States: Implement skeleton screens for API loading states
     - Error Handling: Use toast notifications for API errors

# Accessibility Requirements

- All interactive elements must have proper focus states
- Color contrast ratios must meet WCAG AA standards
- Form elements must have associated labels
- Use semantic HTML elements appropriately
- Support keyboard navigation throughout

# Frontend Queue Page Design

# Queue Page Overview

The queue page is the core interaction interface for both audience participants and hosts. It features a real-time message list with voting capabilities, designed for optimal usability during live sessions.

# Layout Structure

1.  Vertical Layout (Mobile-First)

    - Header Section (Top of viewport)
    - Host Control Bar (Conditional, host view only)
    - Message List (Scrollable container, fixed height)
    - Input Area (Sticky bottom section)

2.  Container Specifications

    - Message List Height: 70vh (viewport height) with vertical overflow
    - Input Area: Fixed at bottom with background matching surface color
    - Maximum Width: 768px (centered on larger screens)
    - Padding: 1rem on mobile, 1.5rem on desktop

# Header Components

1.  Queue Information

    - Queue Name: Displayed as H1 heading (font-size: 1.5rem, weight: 600)
    - Queue ID: Copyable code component with copy-to-clipboard functionality
      - Style: Monospace font, muted color, hover effect reveals copy icon
    - Expiry Countdown: Live timer showing "Expires in: 23:59:30"
      - Color transitions from neutral to warning as time decreases

2.  Host Control Bar (Host View Only)

    - Position: Below header, above message list
    - Sort Toggles: Two-button toggle group for sorting options
      - Options: "Most Votes" (default) and "Newest"
      - Active state: Primary color fill, inactive: outlined variant
    - Host Indicator: Badge showing "Host Mode" with subtle background

# Message List Component

1.  Container Properties

    - Height: 70vh (responsive to viewport height)
    - Overflow: Vertical scrolling only
    - Background: Surface color (#FFFFFF)
    - Empty State: Centered message "No questions yet. Be the first to ask!"
      - Includes subdued illustration icon

# Message Card Components

Each message card uses a horizontal layout with the following structure:

1.  Left Section (Voting)

    - Vote Button: Heart icon (♥) with following states:
      - Default: Outlined icon, neutral color
      - Voted: Filled icon, primary color (#4F46E5)
    - Vote Count: Number displayed adjacent to button (medium weight)

2.  Center Section (Content)

    - Message Text: Body text (1rem, line-height: 1.5)
    - Metadata: Smaller text (0.875rem, color: #6B7280)
      - Format: "{author_name} • {relative_time}"
      - Example: "Anonymous • 2m ago"

3.  Right Section (Actions)

    - Read Status Indicator (All users):

      - Unread: Hollow circle ◦
      - Read: Checkmark icon ✓ (color: #10B981)

    - Host Actions (Host view only):
      - Toggle Read: Eye icon (👁️), toggles is_read status
      - Delete: Trash icon (🗑️), opens confirmation dialog
      - Spacing: 8px between action icons

# Visual Treatment

         - Card Separation: 1px bottom border with alpha channel (rgba(0,0,0,0.1))
         - Hover Effects: Subtle background darkening on message hover
         - Animation: Smooth enter/exit transitions for messages

# Input Area

1.  Composition

    - Textarea: Flexible height input with placeholder "Ask your question..."

      - Minimum height: 56px
      - Maximum height: 120px (with scrollbar)

    - Author Name Field: Optional text input with placeholder "Your name (optional)"

      - Initially collapsed, expandable via toggle

    - Submit Button: "Send" button with primary styling
      - Disabled state when textarea is empty

2.  Positioning

    - Sticky Behavior: Fixed to bottom of viewport on mobile
    - Desktop Layout: Pinned to bottom of message list container

# Interaction Design

1.  Real-Time Updates

    - New Messages: Slide-in animation from bottom
    - Updated Messages: Subtle highlight pulse (2-second duration)
    - Scroll Behavior: Auto-scroll to new messages only if already near bottom

2.  Sorting Behavior

    - Initial Sort: Respects queue's default_sort_order setting
    - Client-Side Sorting: Re-sorts existing messages instantly on toggle change
    - Visual Feedback: Smooth reordering animation

3.  Host Privileges

    - View Activation: Host view enabled when host_secret is present in application state
    - Destructive Actions: Delete button requires confirmation via modal dialog
    - State Synchronization: Read status updates propagate to all connected clients

# Responsive Behavior

1.  Mobile Optimizations

    - Touch Targets: All buttons and interactive elements minimum 44px
    - Viewport Management: Virtual keyboard does not obscure input area
