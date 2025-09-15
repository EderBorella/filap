# Filap

A minimal app for live Q&A. Hosts create a queue, share the link, and audiences submit anonymous questions. Features upvoting and allows the host to sort questions by votes or time. Perfect for streamers and voice chats.

## Features

- **Anonymous Q&A**: No sign-up required for participants
- **Real-time updates**: Live question submission and voting via Server-Sent Events
- **Upvoting system**: Audiences can vote for their favorite questions
- **Host controls**: Sort by votes or time, mark questions as read, moderate content
- **Auto-cleanup**: Queues automatically expire after 24 hours
- **Multi-tenant**: Multiple isolated queues can run simultaneously
- **Internationalization**: Multi-language support with i18n

## Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, Vite, React Router, i18next |
| Backend | Python, Flask, Flask-SQLAlchemy, Flasgger |
| Development Database | SQLite |
| Production Database | PostgreSQL |
| Deployment | Railway / Render |

## Project Structure

```
filap/
├── filap-app/          # React frontend application
│   ├── src/
│   ├── package.json
│   └── ...
├── filap-api/          # Flask backend API
│   ├── models/         # SQLAlchemy models
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic layer
│   ├── tests/          # Test suites
│   ├── app.py         # Flask application entry point
│   ├── requirements.txt
│   └── ...
├── dev-support.md      # Backend architecture documentation
└── dev-support-frontend.md  # Frontend design guidelines
```

## Quick Start

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.8+ (for backend)
- SQLite (development) or PostgreSQL (production)

### Backend Setup

1. Navigate to the API directory:
```bash
cd filap-api
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Flask application:
```bash
python app.py
```

The API will be available at `http://localhost:5000` with Swagger documentation at `http://localhost:5000/api/docs/`.

### Frontend Setup

1. Navigate to the app directory:
```bash
cd filap-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Available Scripts (Frontend)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run generate-api` - Generate API client from OpenAPI spec

## Architecture

### Three-Tiered Architecture

- **Routes** (`filap-api/routes/`): HTTP endpoint handlers that parse requests, validate auth, and return responses
- **Services** (`filap-api/services/`): Business logic layer containing all rules and orchestrating model interactions
- **Models** (`filap-api/models/`): Data layer with SQLAlchemy models handling schema and relationships

### Key Components

#### Backend (filap-api)
- **Flask Application**: Main API server with CORS and Swagger documentation
- **Database Models**: Queue, Message, and MessageUpvote models with proper relationships
- **Real-time Events**: Server-Sent Events for live updates
- **Authentication**: Host secret tokens and user fingerprinting

#### Frontend (filap-app)
- **React 19**: Modern React with hooks and context
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing
- **i18next**: Internationalization support
- **Responsive Design**: Mobile-first approach with clean, minimal UI

## Core Features

### Queue & Session Management
- Multi-tenancy with unique queue IDs
- Host session persistence via localStorage tokens
- Automatic 24-hour session expiry with cleanup

### Real-Time Updates
- Server-Sent Events (SSE) for live updates
- Instant synchronization for new questions, votes, and status changes
- Real-time sorting and moderation

### Voting System
- One vote per user (anonymous fingerprinting)
- Sort by most votes or newest first
- Atomic vote count updates

### Data Models

#### Queue Model
- `id` (UUID) - Public queue identifier
- `name` - Optional queue name
- `host_secret` (UUID) - Private host token
- `created_at` & `expires_at` - Automatic 24h expiry
- `default_sort_order` - Queue settings

#### Message Model
- `id` (UUID) - Message identifier
- `queue_id` - Foreign key to queue
- `text` & `author_name` - Message content
- `vote_count` - Denormalized vote counter
- `is_read` - Boolean status flag

#### MessageUpvote Model
- `id` (UUID) - Upvote identifier
- `message_id` & `user_token` - Voting relationship
- Unique constraint preventing duplicate votes

## API Documentation

The API provides comprehensive Swagger documentation available at `/api/docs/` when running the backend server.

### Key Endpoints

- **Queue Management**: Create, retrieve, and update queues
- **Message Management**: Submit, retrieve, update, and delete messages
- **Voting**: Cast and manage upvotes
- **Real-Time Events**: SSE endpoint for live updates

Authentication uses header-based tokens:
- `X-Queue-Secret`: Host authentication
- `X-User-Token`: User identification for voting

## Development

### Running Tests

Backend tests:
```bash
cd filap-api
python -m pytest
```

### API Client Generation

Generate TypeScript API client from OpenAPI spec:
```bash
cd filap-app
npm run generate-api
```

### Environment Configuration

Backend configuration is handled through environment variables and `config.py`.

## Design Philosophy

The frontend follows a modern, minimalistic design approach:
- Clean, lightweight interface optimized for live sessions
- Mobile-first responsive design
- Accessibility compliance (WCAG AA)
- Real-time updates with smooth animations
- Intuitive host controls and audience participation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing architecture
4. Add tests for new functionality
5. Update documentation as needed
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.