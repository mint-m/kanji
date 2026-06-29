# CLAUDE.md

> Technical docs: [docs/PROJECT_DOCS.md](./docs/PROJECT_DOCS.md)

## Stack

- Frontend: React 18 + TypeScript, Redux Toolkit (minimal), Vanilla Extract, React Router v6
- Backend: Node.js + Express + TypeScript, MongoDB + Mongoose, Google & Kakao OAuth 2.0 + JWT

## Commands

```bash
yarn start                  # frontend + backend
cd frontend && yarn start   # frontend only (http://localhost:4200)
cd backend && yarn dev      # backend only (http://localhost:8000)
yarn test                   # tests (run in frontend/ or backend/)
yarn test:e2e               # playwright e2e
```

## Architecture Rules

- Redux only for auth state and active session type — all other state via service layer
- Business logic in Mongoose model methods, not controllers
- All API calls through `services/apiClient.ts`, never direct axios in components

## Code Rules

- Write only what is needed now — no future-proofing
- Delete before adding
- No abstraction until rule of three
- One responsibility per function/component

## Commit Convention

Format: `<type>: <description in Korean>` — no scope `()`, no trailing period

| type | when |
|------|------|
| `feat` | new feature |
| `fix` | bug fix |
| `refactor` | restructure without behavior change |
| `perf` | performance improvement |
| `test` | add or update tests |
| `style` | UI/style only, no logic change |
| `chore` | build, config, deps |
| `docs` | documentation only |

- One commit = one logical change
- Group files by purpose; split if different purposes
- No WIP commits

## Environment Variables

**backend/.env**
```
MONGO_URI=mongodb://localhost:27017/kanji
PORT=8000
SESSION_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_REST_API_KEY=
```

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=
```
