# CLAUDE.md

> 기술 문서: [docs/PROJECT_DOCS.md](./docs/PROJECT_DOCS.md) · 배포: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) · 학습 철학: [docs/LEARNING_PHILOSOPHY.md](./docs/LEARNING_PHILOSOPHY.md)

## Project

kanji — JLPT 일본어 단어 학습 앱. "윈도우로 익히고, 간격 복습으로 굳힌다" — 3스텝 슬라이딩 윈도우 덱 + 단어별 간격 복습.
**v5 리뉴얼(2026-10, `feat/service-renewal`)**: 간격 복습·홈·학습 카드·기록 화면을 새로 짰다. 안정성·완성도·코드 축소를 우선하는 원칙은 그대로다.

## Stack

- Frontend: React 18 + TypeScript (CRA), Redux Toolkit (minimal), Vanilla Extract, React Router v6
- Backend: Node.js + Express + TypeScript, MongoDB + Mongoose, Google & Kakao OAuth 2.0 + JWT

## Commands

```bash
yarn start                  # frontend + backend
yarn start:memory           # frontend + backend on in-memory MongoDB with sample words (no Atlas)
cd frontend && yarn start   # frontend only (http://localhost:4200)
cd backend && yarn dev      # backend only (http://localhost:8000)
cd backend && yarn dev:memory  # backend only, in-memory MongoDB + sample words (prints a dev login line)
cd backend && yarn build    # production build (tsc → dist/)
yarn test                   # tests (run in frontend/ or backend/)
yarn test:e2e               # playwright e2e (mock 데이터 기반, e2e/helpers/)
```

Deployment: Vercel (frontend) + Render (backend) + MongoDB Atlas — see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
Live: https://kanji-red.vercel.app (Vercel) · https://kan-ji.onrender.com (Render 서비스 `kan-ji`) — `kanji.vercel.app`·`kanji-api.onrender.com`은 이 앱이 아님

## Domain Model

코드를 읽기 전에 알아야 할 핵심 개념 (상세: PROJECT_DOCS.md):

- **Window**: 3-step 학습 단위. `1-3 → 2-4 → …` 순으로 슬라이딩, 레벨 끝에서 순환(`9-1`, `10-2`, 레벨 내에서만).
- **Pass**: 덱 1회 순회. 완료 시 "모름" 단어만 재셔플해 새 패스 시작 → 전부 "알았음"이면 Window 완료.
- **Session**: `main`(화면 이름 "진도 학습", 슬라이딩 윈도우 진행) / `sub`("집중 학습", 단일 스텝 반복 루프). `UserCheckpoint` 레코드로 각각 독립 관리. 화면 용어만 바꿨고 코드·DB·API는 `main`/`sub` 그대로다.
- **WordProgress**: 단어별 상태. `is_window_completed`는 윈도우 이동 시 리셋되는 임시 플래그, `try_count`/`correct_count`/`is_bookmarked`는 영구 보존.
- **Bookmark**: 세션 간 공유 개념(최대 150개, 초과 시 409 `BOOKMARK_LIMIT_EXCEEDED`). 단, 레코드는 `progress_type`별로 분리되어 있어 토글 시 원래 세션의 `progressType`을 전달해야 한다.
- **Review**: 단어별 간격 복습 상태(`word_review`, 사용자·단어당 1건, 세션과 독립). 진도·집중 학습에서 처음 "알아요"를 누르면 다음 날 한국 자정부터 1단계로 나오고, 복습에서 맞힐 때마다 1·3·7·14·30·60일 간격으로 늘어난다. 몰라요는 0단계(바로 다시). "익힌 단어" = 복습에 등록된 단어, "장기 기억" = 4단계(14일) 이상.

## Key Files

- `backend/src/models/userCheckpoint.ts` — 세션 상태 + 패스/윈도우 판정 (핵심 비즈니스 로직)
- `backend/src/services/slidingWindowService.ts` — 윈도우 계산·덱 생성·셔플
- `backend/src/controllers/deckController.ts` — 학습 플로우 API (`complete-word`, `complete-deck`)
- `backend/src/models/wordReview.ts` — 간격 복습 일정(등록·응답 반영)
- `frontend/src/pages/FlashCardPage/` + `components/FlashCardContainer/` — 학습 UI 상태 머신
- `frontend/src/components/StudyCard/` — 진도 학습·오늘의 복습·북마크 학습이 함께 쓰는 단어 카드(공개·응답·단축키·발음·한자 풀이)
- `frontend/src/pages/` — 홈(`Main`: 로그인 전 랜딩 / 후 오늘 할 일), 학습 시작(`StartPage`), 오늘의 복습(`ReviewPage`), 기록(`StatsPage`)
- `frontend/src/services/` — 모든 API 호출 (아키텍처 규칙 참조)

## Architecture Rules

- Redux는 auth 상태·활성 세션 타입·한자 조회 캐시(`store/modules/kanji.ts`)에 한정 — 신규 상태는 service layer로
- Business logic in Mongoose model methods, not controllers
- All API calls through `services/apiClient.ts`, never direct axios in components
- API 응답은 `{ success, data, message? }` 봉투 형식 유지
- Mongo 컬렉션 이름은 명시 지정됨: `word`, `user_checkpoints`, `word_progress`, `word_review` — 북마크 aggregation의 `$lookup from: 'word'`가 이에 의존하므로 변경 금지

## Invariants & Gotchas

수정 시 깨뜨리기 쉬운 지점:

- `complete-word`는 `index`를 보내면 서버 위치와 다를 때 기록 없이 409(`PROGRESS_OUT_OF_SYNC`)를 돌려준다 — 재시도가 다른 단어를 기록하지 않는다. 프론트는 `requestQueueRef`(직렬화) + `lastSubmittedWordIdRef`(중복 클릭 방어)를 유지하고, 요청이 실패하면 이후 요청을 멈추고 "다시 불러오기" 화면을 띄운다.
- `windowComplete: true` 응답 후 프론트가 `complete-deck`을 호출해야 다음 윈도우가 생성된다. `complete-deck` 중복 호출은 400 — `FlashCardPage`의 `deckCompletedRef`가 방어.
- Sub 세션의 `complete-deck`은 다음 윈도우 대신 같은 스텝의 단어 **전체**로 새 덱을 만든다(`restartWindow`, `isSubLoop: true`) — "다시 학습하기" UI로 분기. 마지막 패스의 단어만 섞으면 루프가 점점 줄어든다 (`deckController.test.ts` "서브").
- 새 윈도우를 만들 때(`createNewSession`·`generateNextSlidingWindow`·`restartWindow`) 새 덱 단어의 `is_window_completed`를 리셋한다 — 겹치는 스텝의 단어가 이전 윈도우의 '알았음'을 들고 오지 않는다.
- 복습 응답은 기한이 된 단어에만 반영된다(`applyAnswer`가 아니면 `applied: false`) — 재전송·중복 클릭이 단계를 두 번 올리지 않는다. 진도·집중 학습의 응답은 복습 일정을 바꾸지 않고 처음 "알아요"일 때 등록만 한다 (`wordReviewModel.test.ts`, `learningFlow.int.test.ts` "간격 복습").
- 연속 학습일은 `statistics.lastStudyDate`(한국 시간 날짜)로 센다. 로그인·토큰 갱신이 `profile.lastActiveAt`을 바꾸므로 그 값으로 판단하면 로그인한 날의 학습이 빠진다 (`userModel.test.ts`).
- 완료 화면에서 `complete-deck` 없이 이탈하면 세션이 `currentIndex = 덱 길이`로 남는다 — 재진입 시 `FlashCardPage`가 `deckStatus`로 완료 화면을 복원한다 (E2E `완료 화면 재진입` 참조).
- 북마크 조회 `limit` 상한은 `BOOKMARK_LIMIT`(150)과 같아야 한다 — 복습 페이지가 전체를 한 번에 조회한다 (`bookmarkRoutes.test.ts` 참조).
- Google 로그인 스크립트(GSI)는 client_id가 비면 `initCodeClient`에서 예외를 던진다 — 로그인 전 화면 전체가 "문제가 발생했어요"가 된다. `.env`가 없는 CI를 위해 E2E는 브라우저 인자로 accounts.google.com을 막는다(`playwright.config.ts`). 스크립트가 늦게 오면 통과해 실패가 들쭉날쭉하다. 로컬도 `frontend/.env`의 `REACT_APP_GOOGLE_OAUTH_CLIENT_ID`가 비면 같은 화면이 된다 (E2E `로그인 페이지`·`홈`).
- 4xx 응답의 `code`(예: `BOOKMARK_LIMIT_EXCEEDED`)는 `getErrorCode`(`services/apiClient.ts`)로 읽는다 — `apiClient` 호출은 `AxiosError`, 인증 호출(`authService`)은 `ApiError`로 실패한다. `instanceof ApiError`로 판별하면 실제 요청의 코드는 무시된다 (`useToggleBookmark.test.ts`는 실제와 같은 `AxiosError`로 검증).
- 프론트에서 상대 경로 API 호출 금지 — Vercel/Render 분리 배포에서 405 발생 (커밋 84d8bf8 참조). 항상 `API_URL` 기반으로 호출.
- 프론트 CI 빌드는 CRA 기준으로 엄격함 — cleanup 함수에서 ref 직접 참조 등 lint 위반 시 빌드 실패 (커밋 37ebbfc 참조).
- `backend/src/scripts/`는 일회성 데이터 관리 스크립트 — 프로덕션 빌드(`tsconfig.build.json`)에서 제외됨.
- 카카오 OAuth는 `startKakaoAuth`가 탭(sessionStorage)에 저장한 무작위 `state`를 콜백에서 대조한 뒤에만 코드를 서버로 보낸다(`services/kakaoOAuth.ts`). 대조를 빼면 남이 만든 콜백 링크로 공격자 카카오가 연동돼 계정을 빼앗긴다 (`KakaoOAuthCallback.test.tsx`).
- 한자 풀이는 네이버 결과만 서버 캐시한다 — DB(KANJIDIC2) 대체 결과는 외부 장애 중에 나오므로 캐시하면 회복된 뒤에도 남는다. KANJIDIC2에는 한국어 훈이 없어 한국 한자음만 보낸다. 네이버의 JLPT는 옛 4단계(4가 가장 쉽다)라 서버가 DB와 같은 새 등급으로 옮겨 보낸다 — 그대로 두면 N5 한자가 N4로 보인다 (`kanjiController.test.ts`).
- 단어의 `pron`·`means`는 사전 표기 그대로다('·' 등으로 묶인 여러 표기, 괄호 송가나 `集(ま)り`, 뜻 안의 `;`). 화면에는 `utils/wordDisplay`를 거쳐 대표 표기·쉼표로 보인다 — 새 화면에서 `pron`을 그대로 찍지 않는다 (`wordDisplay.test.ts`).
- 데이터 출처 화면(`/sources`)은 EDRDG 데이터(지금은 KANJIDIC2, CC BY-SA 4.0)의 사용 조건이다 — 앱 안 별도 화면에 출처·라이선스 링크가 있어야 하므로, 이 데이터를 쓰는 동안 화면과 진입점(사용자 메뉴, 로그인 전 첫 화면 아래)을 지우지 않는다. JMdict 등 다른 EDRDG 파일을 운영 데이터에 넣으면 이 화면에 함께 적는다 (`SourcesPage.test.tsx`, E2E `홈`).

## Learning Data

단어·한자 데이터가 학습 품질의 바탕이고, 리뉴얼 다음 최우선 과제다 (한자 원천 교체 → JMdict 기반 단어 재구축).

- 운영 DB가 단어 데이터의 유일한 사본이다 — 수집 스크립트·원본 파일이 저장소에 없다. 운영 DB에 쓰기 전에는 `word`·`kanji`를 EJSON으로 백업한다(Atlas 무료 클러스터는 휴면할 수 있다).
- 단어 본문은 네이버 일한사전에서 온 것으로 보인다(`origin_entry_id` `JK…`) — 데이터 덤프를 공개 저장소에 커밋하지 않는다.
- `augment:frequency`는 nf 순위를 지우고(점수 1·24·9999뿐), `create:daily`는 JMdict 영어 뜻을 넣는다 — 고치기 전에 운영에서 돌리지 않는다. `clean:words`는 '→' 참조만 있는 기본 단어(みっつ·キッチン 등)까지 지우므로 그대로 쓰지 않는다.

## Code Rules

- Write only what is needed now — no future-proofing
- Delete before adding
- No abstraction until rule of three
- One responsibility per function/component
- 일회성 산출물(검토 보고서·분석·진행 메모)은 새 `.md` 파일로 만들지 않고 Claude 문서로 정리한다 — 저장소 `.md`는 이후 세션이 실제로 읽고 의존하는 문서(CLAUDE.md, `.claude/skills`, 기존 docs)만 둔다

## Testing

PR마다 GitHub Actions CI(`.github/workflows/ci.yml`)가 백엔드 테스트·빌드, 프론트 테스트, E2E를 돌린다.
E2E(`e2e/tests/`)는 API mock 기반이라 백엔드를 띄우지 않아도 된다. 변경 후 무엇을 돌리고 어떤 문서를 갱신할지는 `.claude/skills/verify` 참조.

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

## Branch · PR · Issue

- Branch: `<type>/<english-kebab-summary>` with the commit types above (e.g. `fix/bookmark-limit`). `claude/*` branches created by remote Claude Code sessions are fine as-is
- Merge into `main` only via PR. The repo allows squash merge only, so the PR title becomes the `main` commit message (`(#N)` appended) — write the PR title in the commit format above
- One PR = one logical change. Body follows `.github/pull_request_template.md`; link issues with `Closes #N`
- Issue: use a template in `.github/ISSUE_TEMPLATE/` (결함·작업 / 검토) with at least one label (`bug`, `enhancement`, `documentation`, `security`, `tech-debt`)
- Add every issue to the GitHub project "개발 리스트업 및 이슈 추적용 프로젝트" (mint-m #1, shared with other repos) — from the CLI: `gh issue create --project "개발 리스트업 및 이슈 추적용 프로젝트"`

## Environment Variables

전체 목록·주석·기본값은 `backend/.env.example`, `frontend/.env.example`가 단일 출처다. 로컬 개발 시 각각 `.env`로 복사해 값을 채운다.

## Known Limitations

인지하고 있는 한계 (재발견 방지용):

- 진도·집중 학습 중 이미 복습 기한이 된 단어를 "알아요"로 넘겨도 복습 일정은 그대로다 — 두 흐름이 서로의 일정을 흔들지 않도록 한 설계다 (복습은 오늘의 복습에서만 진행).
- 간격 복습은 리뉴얼 이후의 "알아요"부터 쌓인다. 기존 사용자의 과거 기록은 배포 후 1회 `cd backend && yarn backfill:reviews --apply`로 옮긴다 (`--apply` 없이 실행하면 미리 보기, 여러 번 실행해도 같은 결과).
- 프론트 빌드 도구는 CRA(react-scripts 5, 지원 종료) 그대로다 — Vite 전환은 배포 설정(Vercel)과 함께 할 별도 작업.
