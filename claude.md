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
cd backend && yarn build    # production build (tsc → dist/)
yarn test                   # tests (run in frontend/ or backend/)
yarn test:e2e               # playwright e2e
```

Deployment: Vercel (frontend) + Render (backend) + MongoDB Atlas — see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

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

Full lists with comments: `backend/.env.example`, `frontend/.env.example`

**backend/.env**
```
MONGO_URI=mongodb://localhost:27017/kanji
PORT=8000
ALLOWED_ORIGINS=http://localhost:4200
SESSION_SECRET=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4200/auth/google/callback
KAKAO_REST_API_KEY=
```

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_OAUTH_CLIENT_ID=
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:4200/auth/google/callback
REACT_APP_KAKAO_REST_API_KEY=
REACT_APP_KAKAO_REDIRECT_URI=http://localhost:4200/auth/kakao/callback
```
