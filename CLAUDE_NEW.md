# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **📚 Detailed Documentation**: See [PROJECT_DOCS.md](./PROJECT_DOCS.md) for comprehensive technical documentation in Korean.

## Development Commands

### Full Stack Development

- `yarn start` - Runs both frontend and backend concurrently
- Frontend runs on http://localhost:4200 (proxy to backend on port 8000)
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
  - `/api/progress/*` - User learning progress, session management, and deck operations
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
│   ├── progress/   # UserCheckpoint state management
│   ├── deck/      # Current deck state
│   └── bookmarks/ # Bookmark state
├── services/      # API service layer
├── styles/        # Global styles and theme
└── utils/         # Utility functions

backend/src/
├── controllers/   # Request handlers
├── models/        # Mongoose schemas
│   ├── User.ts         # User authentication data
│   ├── Word.ts         # Word master data with step field
│   ├── UserCheckpoint.ts # Learning session state (MAIN SYSTEM)
│   └── WordProgress.ts # Individual word completion status
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

### Simplified Database Structure

**Single unified checkpoint system**: All session state and checkpoint functionality combined in **UserCheckpoint**.

---

### Core Collections

```typescript
// Users - Basic authentication data
{
  _id: ObjectId,
  email: string (unique),
  name: string,
  type: "google",
  learningCheckpoint: {        // Legacy field for backward compatibility
    level: string,
    step: { start: number, end: number }
  },
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
  step: number,            // Step within level (flexible, based on word count)
  means: string[],         // Korean meanings
  parts: string[]          // Parts of speech
}

// UserCheckpoint - Session state + checkpoint (UNIFIED)
// Collection name: "user_checkpoints"
{
  _id: ObjectId,
  user_id: ObjectId,
  progress_type: "main" | "sub",
  current_level: string,
  steps: { start: number, end: number },
  shuffled_order: ObjectId[],    // Shuffled word IDs
  current_index: number,          // Current position in deck
  created_at: Date,
  updated_at: Date                // Auto-tracks last activity
}

// WordProgress - Individual word completion
{
  _id: ObjectId,
  user_id: ObjectId,
  word_id: ObjectId,
  progress_type: "main" | "sub",
  is_completed: boolean,
  try_count: number,
  is_bookmarked: boolean,         // Shared across progress_type
  last_studied_at?: Date,
  created_at: Date
}
```

### Key Technical Details

**Authentication Flow**:

- Google OAuth 2.0 integration
- JWT token-based authentication
- Protected routes with user session validation

**Learning Flow (Main System)**:

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

## API Endpoints

```
GET  /api/progress/:type                        # Get current session
POST /api/progress/:type                       # Create new session
DELETE /api/progress/:type                     # Delete session

GET  /api/progress/:progressType/current       # Get current deck
POST /api/progress/:progressType/complete-word # Complete a word
POST /api/progress/:progressType/complete-deck # Complete deck & move to next window

POST /api/bookmarks/toggle                     # Toggle bookmark
GET  /api/bookmarks                            # Get bookmarked words
```

## Checkpoint Functionality

UserCheckpoint automatically tracks session state:
- **Auto-save**: After every word via `updateCheckpoint()` method
- **Auto-update**: `updated_at` field tracks last activity
- **Session restore**: Query by user_id + progress_type
- **Simple**: No separate checkpoint collection needed

## Environment Configuration

**Required Environment Variables**:

```bash
# Backend (.env)
MONGO_URI=mongodb://localhost:27017/kanji
PORT=8000
SESSION_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Migration Status (as of 2025-01-18)

### ✅ Completed

1. **API Service Layer** (Frontend):
   - `services/apiClient.ts` - HTTP client
   - `services/progressService.ts` - Progress API
   - `services/deckService.ts` - Deck API
   - `services/bookmarkService.ts` - Bookmark API
   - TypeScript types defined

### 🔄 In Progress

2. **Redux Store Refactoring**:
   - Transitioning from legacy deck store to UserCheckpoint-based store
   - Separating Main/Sub session management

### ⏳ Planned

3. **Component Migration**:
   - FlashCardPage
   - LevelSelectionPage
   - UserCheckpoint components

## Important Notes for Claude Code

1. **Simplified Structure**:
   - Single model: UserCheckpoint (session + checkpoint combined)
   - Collection: `user_checkpoints`
   - No separate checkpoint or learning_progress systems

2. **Database Collection Names**:
   - Main collection: `user_checkpoints`
   - Word progress: `word_progress`
   - Words master: `words`
   - Users: `users`

3. **Checkpoint Management**:
   - Use `updateCheckpoint()` method to save
   - Auto-save after every word in controllers
   - No complex TTL or cleanup logic needed

4. **Frontend Migration**:
   - Legacy: `/api/words/level/{level}` (deprecated)
   - New: `/api/progress/{progressType}/current` (recommended)
   - Store: UserCheckpoint-based (not UserProgress)

## Related Documentation

- `PROJECT_DOCS.md` - Comprehensive technical documentation (Korean)
- `backend/src/services/slidingWindowService.ts` - Window generation logic
- `backend/src/models/userCheckpoint.ts` - Main session state model

---

This application implements a sophisticated spaced repetition system using sliding window methodology for efficient Japanese vocabulary acquisition, with emphasis on user progress tracking and personalized learning paths.
