# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Full Stack Development

- `yarn start` - Runs both frontend and backend concurrently
- Frontend runs on http://localhost:3000 (proxy to backend on port 8000)
- Backend runs on http://localhost:8000

### Frontend (React with TypeScript)

```bash
cd frontend
yarn start    # Development server
yarn build    # Production build
yarn test     # Run tests
```

### Backend (Node.js with TypeScript and Express)

```bash
cd backend
yarn dev      # Development with nodemon
yarn start    # Production (requires compiled JS)
```

## Architecture Overview

This is a full-stack Japanese word learning application implementing a sliding window deck system with separate frontend and backend services.

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6 with lazy-loaded pages and route protection
- **State Management**: Redux Toolkit with modular store structure
- **Styling**: Styled Components with theme system
- **Key Routes**:
  - `/` - Main dashboard with progress overview
  - `/login` - Authentication
  - `/profile` - User profile with Main/Sub session switching
  - `/study` - FlashCard learning interface
  - `/bookmarks` - Bookmark management page
  - `/statistics` - Learning analytics (Phase 2)

### Backend Architecture

- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Google OAuth 2.0 with JWT tokens
- **API Structure**: RESTful routes organized by domain
- **Key Routes**:
  - `/auth/*` - Google OAuth authentication
  - `/api/progress/*` - User learning progress (main/sub sessions)
  - `/api/deck/*` - Deck generation and completion tracking
  - `/api/words/*` - Word data and search
  - `/api/bookmarks/*` - Bookmark management

### Project Structure

```
frontend/src/
├── components/     # Reusable UI components
│   ├── FlashCard/  # Main learning interface component
│   ├── Dashboard/  # Progress overview components
│   └── Bookmark/   # Bookmark management components
├── pages/         # Route-level page components
├── store/         # Redux store modules
│   ├── progress/   # UserProgress state management
│   ├── deck/      # Current deck state
│   └── bookmarks/ # Bookmark state
├── services/      # API service layer
├── styles/        # Global styles and theme
└── utils/         # Utility functions

backend/src/
├── controllers/   # Request handlers
├── models/        # Mongoose schemas
│   ├── User.js         # User authentication data
│   ├── Word.js         # Word master data with step field
│   ├── UserProgress.js # Learning progress tracking
│   └── WordProgress.js # Individual word completion status
├── routes/        # Express route definitions
├── middleware/    # Custom middleware
├── services/      # Business logic layer
├── config/        # Configuration files
└── types/         # TypeScript type definitions
```

## Core Learning System

### Sliding Window Deck System

- **Concept**: 3-step sliding window (1-3 → 2-4 → 3-5)
- **Deck Generation**: Filters completed words, prioritizes bookmarked words
- **Progress Tracking**: Independent Main/Sub sessions with checkpoints
- **Circular Review**: Level-end wraparound (8-10 → 9-1 → 10-2)

### Key Features

1. **Checkpoint System**: Automatic save/restore of learning position
2. **Dual Sessions**: Main (systematic) and Sub (bookmark-focused) learning paths
3. **Bookmark Management**: Star difficult words for focused review
4. **Progress Analytics**: Study statistics and streak tracking (Phase 2)

## Data Models

### Core Collections

```typescript
// Users - Basic authentication data
{
  _id: ObjectId,
  email: string (unique),
  name: string,
  type: "google",
  createdAt: Date,
  updatedAt: Date
}

// Words - Master word data with step classification
{
  _id: ObjectId,
  origin_entry_id: string (unique),
  entry: string,           // Hiragana reading
  pron?: string,           // Kanji form
  level: string,           // N5, N4, etc.
  step: number,            // Step within level (1-10)
  means: string[],         // Korean meanings
  parts: string[]          // Parts of speech
}

// UserProgress - Learning session state
{
  _id: ObjectId,
  user_id: ObjectId,
  progress_type: "main" | "sub",
  current_level: string,
  steps: { start: number, end: number },
  shuffled_order: ObjectId[],
  current_index: number,
  created_at: Date,
  updated_at: Date
}

// WordProgress - Individual word completion
{
  _id: ObjectId,
  user_id: ObjectId,
  word_id: ObjectId,
  progress_type: "main" | "sub",
  is_completed: boolean,
  try_count: number,
  is_bookmarked: boolean,
  last_studied_at?: Date,
  created_at: Date
}
```

### Key Technical Details

**Authentication Flow**:

- Google OAuth 2.0 integration
- JWT token-based authentication
- Protected routes with user session validation

**Learning Flow**:

1. Check for existing checkpoint → restore or create new deck
2. Generate deck from 3-step window, filter completed words
3. Present flashcards with bookmark toggle
4. Record "completed" vs "need more study" choices
5. Auto-save checkpoint, move to next deck when finished

**Database Optimization**:

- Compound indexes on user_id + progress_type
- Level + step indexes for efficient deck queries
- Bookmark filtering indexes for management page

**Frontend State Management**:

- Redux modules for progress, deck, and bookmark states
- Automatic checkpoint saving on component unmount
- Session restoration on app reload

## Migration Requirements

### Phase 1 Development (4 weeks)

1. **Week 1**: Database migration (add step field to Words, create new collections)
2. **Week 2**: Core deck system and sliding window logic
3. **Week 3**: FlashCard interface and checkpoint system
4. **Week 4**: Bookmark management and Main/Sub session switching

### Data Migration Scripts

- Migrate existing `user.learningCheckpoint` → `UserProgress` collection
- Calculate and populate `step` field for existing Word documents
- Create indexes for performance optimization

## Environment Configuration

**Required Environment Variables**:

- `MONGO_URI` - MongoDB connection string
- `PORT` - Backend server port (default: 8000)
- `SESSION_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret

This application implements a sophisticated spaced repetition system using sliding window methodology for efficient Japanese vocabulary acquisition, with emphasis on user progress tracking and personalized learning paths.
