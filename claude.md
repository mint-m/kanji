# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **📚 Detailed Technical Docs**: See [PROJECT_DOCS.md](./docs/PROJECT_DOCS.md) for architecture, API specs, and database schemas (Korean).

---

## Development Philosophy

### Core Principles

1. **Avoid Over-Engineering**

   - Write only what is needed NOW
   - Don't build for hypothetical future requirements
   - Simple solutions over complex abstractions

2. **Clean & Minimal Code**

   - Prioritize readability and maintainability
   - Remove unused code immediately
   - One responsibility per function/component

3. **Iterate, Don't Perfect**

   - Ship working code first
   - Refactor when actually needed, not "just in case"
   - Real user feedback > theoretical optimization

4. **YAGNI (You Aren't Gonna Need It)**
   - No premature abstraction
   - No "future-proof" layers without clear use case
   - Delete more, add less

### Code Review Checklist

Before writing or modifying code, ask:

- ❌ Is this solving a problem we don't have yet?
- ❌ Can this be done with fewer lines/files?
- ❌ Am I adding unnecessary abstraction?
- ✅ Does this solve the immediate requirement?
- ✅ Is this code self-explanatory?
- ✅ Can I delete something instead of adding?

### Example Comparisons

**❌ Over-Engineered**:

```typescript
// Too much abstraction for simple CRUD
interface WordRepositoryStrategy {
  find(): Promise<Word[]>;
  cache(): void;
}
class MongoWordRepository implements WordRepositoryStrategy {}
class RedisWordRepository implements WordRepositoryStrategy {}
```

**✅ Clean & Minimal**:

```typescript
// Simple, clear, does the job
const getWords = async (level: string) => {
  return await Word.find({ level });
};
```

---

## Development Commands

### Full Stack Development

```bash
yarn start    # Runs both frontend and backend concurrently
```

- Frontend: http://localhost:4200
- Backend: http://localhost:8000

### Frontend (React + TypeScript)

```bash
cd frontend
yarn start    # Development server
yarn build    # Production build
yarn test     # Run tests
```

### Backend (Node.js + Express + TypeScript)

```bash
cd backend
yarn dev      # Development with nodemon
yarn start    # Production (requires compiled JS)
```

---

## Tech Stack Overview

This is a full-stack Japanese word learning application with a sliding window deck system.

### Frontend

- **Framework**: React 18 + TypeScript
- **State**: Redux Toolkit (minimal: user auth + kanji lookup only)
- **Styling**: Styled Components
- **Routing**: React Router v6

### Backend

- **Runtime**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: Google OAuth 2.0 + JWT

### Project Structure (High-Level)

```
frontend/src/
├── components/  # Reusable UI components
├── pages/       # Route-level pages
├── store/       # Redux (user, kanji)
├── services/    # API layer (checkpoint, deck, bookmark)
└── utils/       # Helper functions

backend/src/
├── controllers/ # Request handlers
├── models/      # Mongoose schemas
├── routes/      # Express routes
├── services/    # Business logic
└── middleware/  # Custom middleware
```

> **Note**: See PROJECT_DOCS.md for detailed file structures, API endpoints, and database schemas.

---

## Core Concepts

### Sliding Window Learning System

A 3-step progressive learning approach:

- **Window**: 1-3 → 2-4 → 3-5 (overlapping steps for natural review)
- **Dual Sessions**: Main (systematic) + Sub (bookmark-focused)
- **Checkpoint**: Auto-save/restore learning position
- **Circular**: Level-end wraparound (8-10 → 9-1 → 10-2)

### Key Architecture Decisions

1. **Unified Model**: `UserCheckpoint` combines session + checkpoint (not separate)
2. **Services > Redux**: API calls handled by services layer, not Redux actions
3. **Simple Checkpoint**: Use `updateCheckpoint()` method, no complex TTL logic
4. **Database Collections**: `users`, `words`, `user_checkpoints`, `word_progress`

---

## Environment Configuration

### Required Variables

**Backend (.env)**:

```bash
MONGO_URI=mongodb://localhost:27017/kanji
PORT=8000
SESSION_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
```

**Frontend (.env)**:

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-google-id
```

---

## Development Workflow

### When Starting a New Feature

1. ✅ **Check if it's really needed now** (avoid over-engineering)
2. ✅ **Write minimal code** to solve the immediate problem
3. ✅ **Test with real data** before adding more complexity
4. ✅ **Refactor only when you see duplication** (rule of three)

### When Reviewing Code

1. ❌ **Remove before adding** - can we delete something instead?
2. ❌ **Challenge abstractions** - is this really needed?
3. ✅ **Focus on clarity** - is it obvious what this does?
4. ✅ **Test edge cases** - does it handle errors gracefully?

---

## Related Documentation

- **[PROJECT_DOCS.md](./docs/PROJECT_DOCS.md)** - Comprehensive technical documentation (Korean)
  - Full architecture details
  - API endpoints and request/response formats
  - Database schemas and relationships
  - Frontend migration guide
- **[README.md](./README.md)** - Project overview and quick start guide

---

## Important Notes

### For Claude Code

- **Flexibility First**: This guide provides principles, not rigid structures
- **Code is Truth**: When in doubt, check actual code over documentation
- **Ask, Don't Assume**: If structure seems outdated, check with developer
- **Iterate**: Start simple, evolve based on real needs

### Project Philosophy

This application prioritizes **simplicity, clarity, and solving actual problems** over theoretical perfection or "future-proofing". The sliding window learning system is sophisticated in pedagogy but simple in implementation.
