# CLAUDE.md

> 기술 문서: [docs/PROJECT_DOCS.md](./docs/PROJECT_DOCS.md) · 배포: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) · 학습 철학: [docs/LEARNING_PHILOSOPHY.md](./docs/LEARNING_PHILOSOPHY.md)

## Project

kanji — JLPT 일본어 단어 학습 앱 (슬라이딩 윈도우 덱 시스템).
**유지보수·종결 단계**: 신규 기능 추가보다 안정성·완성도·코드 축소를 우선한다.

## Stack

- Frontend: React 18 + TypeScript (CRA), Redux Toolkit (minimal), Vanilla Extract, React Router v6
- Backend: Node.js + Express + TypeScript, MongoDB + Mongoose, Google & Kakao OAuth 2.0 + JWT

## Commands

```bash
yarn start                  # frontend + backend
cd frontend && yarn start   # frontend only (http://localhost:4200)
cd backend && yarn dev      # backend only (http://localhost:8000)
cd backend && yarn build    # production build (tsc → dist/)
yarn test                   # tests (run in frontend/ or backend/)
yarn test:e2e               # playwright e2e (mock 데이터 기반, e2e/helpers/)
```

Deployment: Vercel (frontend) + Render (backend) + MongoDB Atlas — see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Domain Model

코드를 읽기 전에 알아야 할 핵심 개념 (상세: PROJECT_DOCS.md):

- **Window**: 3-step 학습 단위. `1-3 → 2-4 → …` 순으로 슬라이딩, 레벨 끝에서 순환(`9-1`, `10-2`, 레벨 내에서만).
- **Pass**: 덱 1회 순회. 완료 시 "모름" 단어만 재셔플해 새 패스 시작 → 전부 "알았음"이면 Window 완료.
- **Session**: `main`(슬라이딩 윈도우 진행) / `sub`(단일 스텝 반복 루프). `UserCheckpoint` 레코드로 각각 독립 관리.
- **WordProgress**: 단어별 상태. `is_window_completed`는 윈도우 이동 시 리셋되는 임시 플래그, `try_count`/`correct_count`/`is_bookmarked`는 영구 보존.
- **Bookmark**: 세션 간 공유 개념(최대 150개, 초과 시 409 `BOOKMARK_LIMIT_EXCEEDED`). 단, 레코드는 `progress_type`별로 분리되어 있어 토글 시 원래 세션의 `progressType`을 전달해야 한다.

## Key Files

- `backend/src/models/userCheckpoint.ts` — 세션 상태 + 패스/윈도우 판정 (핵심 비즈니스 로직)
- `backend/src/services/slidingWindowService.ts` — 윈도우 계산·덱 생성·셔플
- `backend/src/controllers/deckController.ts` — 학습 플로우 API (`complete-word`, `complete-deck`)
- `frontend/src/pages/FlashCardPage/` + `components/FlashCardContainer/` — 학습 UI 상태 머신
- `frontend/src/services/` — 모든 API 호출 (아키텍처 규칙 참조)

## Architecture Rules

- Redux only for auth state and active session type — all other state via service layer
- Business logic in Mongoose model methods, not controllers
- All API calls through `services/apiClient.ts`, never direct axios in components
- API 응답은 `{ success, data, message? }` 봉투 형식 유지
- Mongo 컬렉션 이름은 명시 지정됨: `word`, `user_checkpoints`, `word_progress` — 북마크 aggregation의 `$lookup from: 'word'`가 이에 의존하므로 변경 금지

## Invariants & Gotchas

수정 시 깨뜨리기 쉬운 지점:

- `complete-word`는 멱등이 아님 — 프론트는 `requestQueueRef`(직렬화) + `lastSubmittedWordIdRef`(중복 클릭 방어)로 보호한다. 이 패턴을 제거하지 말 것.
- `windowComplete: true` 응답 후 프론트가 `complete-deck`을 호출해야 다음 윈도우가 생성된다. `complete-deck` 중복 호출은 400 — `FlashCardPage`의 `deckCompletedRef`가 방어.
- Sub 세션의 `complete-deck`은 다음 윈도우 대신 같은 스텝 재셔플(`isSubLoop: true`) — "다시 학습하기" UI로 분기.
- 완료 화면에서 `complete-deck` 없이 이탈하면 세션이 `currentIndex = 덱 길이`로 남는다 — 재진입 시 `FlashCardPage`가 `deckStatus`로 완료 화면을 복원한다 (E2E `완료 화면 재진입` 참조).
- 북마크 조회 `limit` 상한은 `BOOKMARK_LIMIT`(150)과 같아야 한다 — 복습 페이지가 전체를 한 번에 조회한다 (`bookmarkRoutes.test.ts` 참조).
- `ApiError`(`services/authService.ts`)가 409 응답의 `code`를 보존한다 — `apiClient`가 4xx를 throw로 변환하기 때문. 에러 처리 수정 시 유지 필수.
- 프론트에서 상대 경로 API 호출 금지 — Vercel/Render 분리 배포에서 405 발생 (커밋 84d8bf8 참조). 항상 `API_URL` 기반으로 호출.
- 프론트 CI 빌드는 CRA 기준으로 엄격함 — cleanup 함수에서 ref 직접 참조 등 lint 위반 시 빌드 실패 (커밋 37ebbfc 참조).
- `backend/src/scripts/`는 일회성 데이터 관리 스크립트 — 프로덕션 빌드(`tsconfig.build.json`)에서 제외됨.

## Code Rules

- Write only what is needed now — no future-proofing
- Delete before adding
- No abstraction until rule of three
- One responsibility per function/component

## Testing

- Backend: Jest 단위 테스트 (`backend/src/__tests__/`, 컨트롤러 중심)
- Frontend: RTL (`frontend/src/__tests__/`)
- E2E: Playwright (`e2e/tests/`, API mock 기반이라 백엔드 불필요)
- 동작 변경 시 해당 영역 테스트를 실행하고, API 응답 형태가 바뀌면 PROJECT_DOCS.md의 해당 섹션도 함께 갱신

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

전체 목록·주석·기본값은 `backend/.env.example`, `frontend/.env.example`가 단일 출처다. 로컬 개발 시 각각 `.env`로 복사해 값을 채운다.

## Known Limitations

종결 시점 기준으로 인지하고 있는 한계 (재발견 방지용):

- 프론트가 호출하지 않는 백엔드 엔드포인트 다수 존재 (`bulk-complete`, `deck-stats`, `bookmarks/search`, `bookmarks/bulk`, `words/search`, `words/random` 등) — 정리(삭제) 후보
