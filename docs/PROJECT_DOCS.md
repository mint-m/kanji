# kanji 프로젝트 문서

> 일본어 단어 학습 애플리케이션 — 슬라이딩 윈도우 덱 + 간격 복습

**최종 업데이트**: 2026-10-24
**버전**: 5.0

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 구조](#데이터베이스-구조)
4. [API 엔드포인트](#api-엔드포인트)
5. [북마크 시스템](#북마크-시스템)
6. [슬라이딩 윈도우 시스템](#슬라이딩-윈도우-시스템)
7. [화면 구성과 학습 플로우](#화면-구성과-학습-플로우)
8. [환경 설정](#환경-설정)

---

## 프로젝트 개요

kanji는 일본어 능력시험(JLPT) 단어를 효율적으로 학습하기 위한 풀스택 웹 애플리케이션입니다.

### 핵심 기능

"윈도우로 익히고, 간격 복습으로 굳힌다."

- **진도 학습** (`main`): 3스텝 윈도우(1-3 → 2-4 → …)를 모두 알 때까지 — 모르는 단어만 다시 섞어 다음 패스
- **집중 학습** (`sub`): 한 스텝을 완전히 익힐 때까지 반복, 끝나면 같은 스텝 전체로 다시
- **오늘의 복습**: 처음 "알아요"를 누른 단어를 1·3·7·14·30·60일 간격으로 다시 묻는 간격 복습(Leitner)
- **북마크 학습**: 어려운 단어를 모아 회차 반복 (최대 150개)
- **기록**: 익힌 단어·장기 기억(레벨별), 연속 학습일, 오늘 학습량/하루 목표
- **학습 카드**: 응답 강조(몰라요/알아요), 키보드 단축키, 발음 듣기, 한자 풀이, 범위 진행 막대
- **daily 레벨**: 시험 무관 생활 필수 어휘 (N5~N1 외 별도)
- **자동 체크포인트**: 단어마다 서버에 위치를 저장하고 어긋나면 409로 막는다

### 기술 스택

**Frontend**:

- React 18 + TypeScript
- Redux Toolkit (상태 관리)
- Vanilla Extract (CSS-in-JS, 타입 안전 스타일링)
- React Router v6

**Backend**:

- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Google OAuth 2.0 + JWT
- RESTful API

---

## 시스템 아키텍처

### Frontend 구조

```
frontend/src/
├── components/
│   ├── Navigation/        # 상단 바(로고·주 메뉴·사용자 메뉴) + 모바일 하단 탭
│   ├── StudyCard/         # 진도 학습·오늘의 복습·북마크 학습 공용 단어 카드 (공개·응답·단축키·발음)
│   ├── StudyHeader/       # 카드 학습 화면 머리글 (제목·범위·카드 순번·진행 막대)
│   ├── FlashCardContainer/ # 진도·집중 학습 상태 머신 (요청 직렬화, 패스·윈도우 완료 화면)
│   ├── OriginWord/        # 단어 표기 — 한자는 누르면 풀이를 조회하는 버튼 (조회 결과 캐시)
│   ├── Kanji/             # 한자 풀이 패널 (넓은 화면은 카드 옆, 좁은 화면은 아래 시트)
│   ├── ProgressBar/       # 공용 진행 막대 (장기 기억 겹침 표시)
│   ├── LoginButton/       # Google · 카카오 로그인 버튼
│   ├── CommonStyled/      # CenterDiv, DefaultButton(variant: primary·know·unknown·ghost)
│   ├── auth/              # 카카오 OAuth 콜백 (state 검증)
│   └── ErrorBoundary.tsx
├── pages/
│   ├── Main/              # / — 로그인 전 Landing, 로그인 후 Home(오늘의 복습·세션 카드)
│   ├── Login/             # /login — Landing과 같은 화면
│   ├── StartPage/         # /start — 학습 방식·레벨·범위 선택 (진도·집중 공통)
│   ├── FlashCardPage/     # /study — 진도·집중 학습
│   ├── ReviewPage/        # /review — 오늘의 복습
│   ├── StatsPage/         # /stats — 기록
│   ├── BookmarkPage.tsx   # /bookmarks — 북마크 목록·메모
│   ├── BookmarkStudyPage/ # /bookmarks/study — 북마크 학습(회차 반복)
│   ├── UserProfilePage.tsx # /profile — 닉네임·하루 목표·계정 연동
│   ├── SourcesPage/       # /sources — 데이터 출처(KANJIDIC2 라이선스 표기, 로그인 불필요)
│   └── NotFound/
├── services/              # 모든 API 호출 (apiClient 경유)
│   ├── apiClient.ts       # axios 인스턴스, 401 처리, getErrorMessage·getErrorCode
│   ├── authService.ts · kakaoOAuth.ts
│   ├── progressService.ts · deckService.ts · reviewService.ts
│   ├── bookmarkService.ts · userService.ts · wordService.ts
│   └── types.ts           # API 응답 타입 (단일 출처)
├── constants/levels.ts    # 레벨 이름·설명, 범위 표기(formatSteps)
├── hooks/useToggleBookmark.ts # 북마크 토글 (낙관적 업데이트 + 롤백)
├── store/modules/         # Redux: user(로그인·활성 세션), kanji(한자 풀이 목록)
├── styles/                # vars(디자인 토큰), global, layout(목록형 페이지 공통 틀)
└── utils/                 # speech(발음 듣기), shuffle
```

옛 주소(`/flash-cards`·`/bookmark`·`/bookmark-study`·`/level-setup`·`/select-level`·`/dashboard`·`/profile/stats`)는 리다이렉트 없이 없앴다 — 실사용자가 없는 단계라 주소를 정리했다(2026-10-29).

### Backend 구조

```
backend/src/
├── controllers/   # auth, progress, deck(학습 플로우), review(간격 복습), bookmark, user, userStats(기록), word, kanji
├── models/        # user, word, kanji, userCheckpoint(세션·패스·윈도우), wordProgress(세션별 단어 상태), wordReview(간격 복습)
├── routes/        # /api/auth, /api/words, /api/users/me/{progress, bookmarks, reviews, stats, preferences, …}
├── services/      # slidingWindowService(윈도우·덱), auth(JWT), kakao
├── middleware/    # auth(JWT·레이트 리밋), validation, errorHandler({ success: false, message })
├── utils/         # date(한국 시간 날짜), errors, shuffle, regex
└── scripts/       # 일회성 데이터 관리 + 로컬 개발 (프로덕션 빌드 제외)
    ├── devServer.ts        # yarn dev:memory — 메모리 MongoDB + 샘플 단어로 API 실행
    ├── sampleWords.ts      # 로컬 개발·통합 테스트용 샘플 단어 (N5 10스텝, daily 3스텝)
    ├── backfillReviews.ts  # yarn backfill:reviews — v5 배포 후 1회, 과거 학습을 간격 복습에 등록
    ├── seedKanji.ts · augmentFrequency.ts · cleanWords.ts · createDailyWords.ts · reorderByFrequency.ts
```

---

## 데이터베이스 구조

### 간소화된 컬렉션 구조

단일 체크포인트 시스템으로 통합되었습니다. **UserCheckpoint** 하나로 세션 상태와 체크포인트 기능을 모두 관리합니다.

---

### 핵심 컬렉션

#### 1. Users

사용자 인증 및 프로필 정보

```typescript
{
  _id: ObjectId,
  email: string,              // 이메일 (unique)
  name: string,               // 사용자 이름
  type: "google" | "kakao" | "local", // OAuth 제공자 타입
  activeProgressType: "main" | "sub" | null, // 현재 활성 세션 타입

  // 사용자 설정
  preferences: {
    studyReminders: boolean,     // 학습 알림 (기본: true)
    reminderTime: string,        // 알림 시간 (기본: "19:00")
    dailyGoal: number,           // 일일 목표 (1-100, 기본: 20)
    theme: "light" | "dark" | "auto", // 테마 (기본: "light")
    language: "ko" | "en" | "ja", // 언어 (기본: "ko")
    soundEffects: boolean,       // 효과음 (기본: true)
    autoPlayAudio: boolean,      // 자동 재생 (기본: false)
  },

  // 사용자 프로필
  profile: {
    displayName?: string,        // 표시 이름
    profilePicture?: string,     // 프로필 사진 URL
    bio?: string,                // 자기소개 (최대 500자)
    studyGoals: string[],        // 학습 목표
    joinedAt: Date,              // 가입일 (기본: now)
    lastActiveAt?: Date,         // 마지막 활동 시간
    timezone?: string,           // 시간대
  },

  // 학습 통계
  statistics: {
    totalWordsStudied: number,   // 총 학습한 단어 수 (기본: 0)
    totalTimeSpent: number,      // 총 학습 시간 (초, 기본: 0)
    currentStreak: number,       // 현재 연속 학습일 (기본: 0)
    longestStreak: number,       // 최장 연속 학습일 (기본: 0)
    averageSessionTime: number,  // 평균 세션 시간 (초, 기본: 0)
    studyDaysCount: number,      // 학습한 일수 (기본: 0)
    favoriteStudyTime?: string,  // 선호 학습 시간
    lastStudyDate?: string,      // 마지막으로 학습한 날 (한국 시간 'YYYY-MM-DD') — 연속 학습일 기준
    todayCount: number,          // lastStudyDate 하루 동안의 응답 수 (오늘 학습량)
  },

  isActive: boolean,             // 계정 활성 여부 (기본: true)
  emailVerified: boolean,        // 이메일 인증 여부 (OAuth: true, 기본: false)
  createdAt: Date,
  updatedAt: Date
}
```

**인덱스**:

- `email: 1` (unique)
- `{ type: 1, email: 1 }` (복합)
- `isActive: 1`
- `{ 'profile.lastActiveAt': 1 }`
- `{ 'statistics.currentStreak': -1 }`

---

#### 2. Words

단어 마스터 데이터

```typescript
{
  _id: ObjectId,
  origin_entry_id: string,    // 원본 ID (unique)
  entry: string,              // 히라가나 읽기
  pron?: string,              // 한자 표기
  level: string,              // N5, N4, N3, N2, N1, daily
  step: number,               // 레벨 내 단계
  frequency: number,          // 사용 빈도 순위 (낮을수록 고빈도, 기본: 9999)
  means: string[],            // 한국어 뜻
  parts: string[],            // 품사
  createdAt: Date
}
```

**인덱스**:

- `origin_entry_id: 1` (unique)
- `{ level: 1, step: 1 }` (복합)
- `{ level: 1 }`, `{ step: 1 }`

> `daily` 레벨은 JLPT 시험 무관 생활 필수 어휘로 설계했지만 운영 데이터는 0개다(화면에서 숨김). 운영 단어에는 `frequency` 값이 없어(2026-10 실측) step은 빈도와 무관하게 27~28개씩 나뉘어 있다 — `augment:frequency`·`reorder:frequency`는 고치기 전에 돌리지 않는다(아래 CLAUDE.md "Learning Data").

---

#### 3. UserCheckpoint

학습 세션 상태 및 체크포인트 (통합)

**컬렉션 이름**: `user_checkpoints`

```typescript
{
  _id: ObjectId,
  user_id: ObjectId,          // ref: User
  progress_type: "main" | "sub",  // 세션 타입
  current_level: string,      // N5, N4, N3, N2, N1
  steps: {
    start: number,
    end: number
  },
  shuffled_order: ObjectId[], // 셔플된 단어 ID 배열 (ref: Word)
  current_index: number,      // 현재 학습 중인 단어 인덱스 (0부터 시작)
  created_at: Date,
  updated_at: Date            // 마지막 학습 시간 자동 추적
}
```

**인덱스**:

- `{ user_id: 1, progress_type: 1 }` (unique, 복합)
- `{ user_id: 1, current_level: 1 }` (복합)

**핵심 메서드**:

- `isCompleted()` - 현재 패스 순회 완료 여부 (`current_index >= shuffled_order.length`)
- `isWindowCompleted(userId, progressType)` - 윈도우 완료 여부 (모든 단어 `is_window_completed = true`)
- `reshuffleUnknownWords(userId, progressType)` - 미지 단어만 추출해 재셔플 후 새 패스 시작
- `canMoveToNextWindow(userId, progressType)` - `isWindowCompleted` 기반으로 이동 가능 여부 판단
- `generateNextSlidingWindow(userId, progressType)` - 다음 윈도우 생성 + 새 덱 단어의 `is_window_completed` 리셋
- `restartWindow(userId, progressType)` - 같은 윈도우의 단어 전체로 새 덱 (서브 세션 집중 루프)
- `getCurrentWord()` - 현재 학습할 단어
- `moveToNext()` - 다음 단어로 이동

**특징**:

- 세션 상태와 체크포인트 기능 통합
- `updated_at`으로 마지막 활동 시간 자동 추적
- 별도의 checkpoint 컬렉션 불필요
- Main/Sub 세션별로 독립적인 레코드

---

#### 4. WordProgress

단어별 완료 상태 추적

```typescript
{
  _id: ObjectId,
  user_id: ObjectId,          // ref: User
  word_id: ObjectId,          // ref: Word
  progress_type: "main" | "sub",
  is_window_completed: boolean, // 현재 윈도우 완료 여부 (윈도우 이동 시 false로 리셋)
  try_count: number,            // 누적 시도 횟수 (영구 보존)
  correct_count: number,        // 누적 정답 횟수 (영구 보존)
  is_bookmarked: boolean,       // 북마크 여부 (세션 간 공유, 영구 보존)

  // 시간 추적
  last_studied_at?: Date,     // 마지막 학습 시간
  first_studied_at?: Date,    // 처음 학습 시간

  // 학습 통계
  study_streak: number,       // 연속 정답 횟수 (기본: 0)
  time_spent_total: number,   // 총 학습 시간 (초, 기본: 0)

  // 북마크 상세 정보
  bookmark_reason?: string,   // 북마크 이유 (최대 200자)
  bookmark_tags: string[],    // 북마크 태그 배열

  created_at: Date
  // updated_at 미사용 (last_studied_at 사용)
}
```

**인덱스**:

- `{ user_id: 1, progress_type: 1 }` (복합)
- `{ user_id: 1, word_id: 1, progress_type: 1 }` (unique, 복합)
- `{ user_id: 1, is_bookmarked: 1 }` (복합)
- `{ user_id: 1, is_window_completed: 1, progress_type: 1 }` (복합)
- `word_id: 1`
- `last_studied_at: 1`

**특징**:

- `is_window_completed`는 윈도우 범위 플래그 — 다음 윈도우 진행 시 `false`로 초기화
- `try_count`, `correct_count`, `study_history`, `is_bookmarked`는 영구 보존
- `is_bookmarked`는 progress_type과 무관하게 공유됨 (Main 북마크 → Sub에서도 유지)

---

#### 5. WordReview

단어별 간격 복습 일정 — **컬렉션 이름**: `word_review`

```typescript
{
  _id: ObjectId,
  user_id: ObjectId,          // ref: User
  word_id: ObjectId,          // ref: Word
  stage: number,              // 0 = 다시 익히는 중, 1~6 = 간격 단계 (1·3·7·14·30·60일)
  next_review_at: Date,       // 이 시각부터 오늘의 복습에 나온다 (간격은 한국 자정 기준)
  review_count: number,       // 복습 응답 수
  lapse_count: number,        // 잊은 횟수 (1단계 이상에서 몰라요)
  last_reviewed_at?: Date,
  learned_at: Date            // 등록 시각 = 처음 "알아요"를 누른 시각
}
```

**인덱스**: `{ user_id: 1, word_id: 1 }` (unique), `{ user_id: 1, next_review_at: 1 }`

- 진도·집중 학습에서 처음 "알아요"를 누르면 1단계로 등록된다(다음 날 한국 자정부터 복습). 세션(main/sub)과 무관하게 단어당 하나다
- 복습에서 알아요 → 다음 단계, 몰라요 → 0단계(바로 다시). 기한 전 응답은 반영하지 않는다
- "익힌 단어" = 등록된 단어, "장기 기억" = 4단계(14일 간격) 이상

---

## API 엔드포인트

모든 인증 필요 엔드포인트는 `/api/users/me/` 하위에 위치한다.
응답은 전부 `{ success, data, message? }` 봉투 형식이다.

**응답 본문 예시는 이 문서에 두지 않는다.** 손으로 옮겨 적은 JSON은 코드와 어긋나도 아무도 알려주지 않지만,
타입 정의와 테스트는 CI가 지킨다. 문서와 코드가 다르면 코드가 맞다.

| 알고 싶은 것 | 볼 곳 |
|---|---|
| 응답 필드 구조 | `frontend/src/services/types.ts` — `CurrentDeck`, `DeckWord`, `CompleteWordResponse`, `SessionStats` |
| 상태 코드·에러 코드·분기 동작 | `backend/src/__tests__/` (아래 표의 각 행 참조) |
| 프론트가 보내는 쿼리가 검증을 통과하는지 | 라우트 테스트 (`bookmarkRoutes.test.ts`처럼 실제 라우터로 요청) |

---

### 인증 (`/api/auth`)

| 메서드 | 경로 | 용도 |
|---|---|---|
| POST | `/google/access-token` | 인가 코드 → 액세스 토큰 교환 |
| POST | `/google/login` | 액세스 토큰으로 로그인 — 토큰 발급 대상(`aud`)과 이메일 인증 여부를 확인한다 |
| POST | `/google/one-tap` | One Tap credential 로그인 — 이메일 인증 여부를 확인한다 |
| POST | `/kakao/callback` | 카카오 인가 코드 콜백 |
| POST | `/link/google`, `/link/kakao` | 기존 계정에 provider 연결 |
| POST | `/refresh` | JWT 갱신 |
| GET | `/profile` | 현재 사용자 정보 |

검증: `backend/src/__tests__/authController.test.ts`

---

### 사용자 (`/api/users/me`)

| 메서드 | 경로 | 용도 |
|---|---|---|
| PATCH | `/me` | 이름 변경 |
| PATCH | `/me/preferences` | 하루 목표 단어 수 변경 `{ dailyGoal }` (1~100) |
| PATCH | `/me/active-progress-type` | 활성 세션 타입 변경 (`main`\|`sub`\|`null`, 그 외 400) |
| PATCH | `/me/checkpoint` | 세션 생성 — **같은 타입 세션이 있으면 409** (교체는 `DELETE /me/progress/:type` 후 생성) |
| GET | `/me/stats` | 학습 기록 — 익힌 단어·장기 기억(레벨별), 복습 대기·다음 복습, 연속 학습일(어제까지 이어진 경우만), 오늘 학습량·하루 목표 (`UserStats` 타입) |

검증: `userController.test.ts`, `userStatsController.test.ts`, `learningFlow.int.test.ts` → `describe('학습 기록')`

---

### 진행 상황 (`/api/users/me/progress`)

| 메서드 | 경로 | 용도 | 검증 |
|---|---|---|---|
| GET | `/` | 세션 목록 — 카드용 요약(레벨·스텝·패스 진행·윈도우 진행 `window: { known, total }`) | `progressController.test.ts`, `learningFlow.int.test.ts` |
| DELETE | `/:type` | 세션 삭제 | `progressController.test.ts` |

`type`은 `"main"` \| `"sub"`.

---

### 덱 (`/api/users/me/progress/:progressType`)

#### 현재 덱 조회 — `GET /current`

응답 구조는 `CurrentDeck` 타입이 단일 출처다. `window`는 패스가 아닌 윈도우 전체 기준 진행(익힘/전체)이다.
동작 검증은 `deckController.test.ts` → `describe('getCurrentDeck')`:
진행 중인 세션이 없으면 404 + `code: "NO_PROGRESS"`, 잘못된 `progressType`은 400.
완료 화면에서 이탈한 세션은 `currentIndex = 덱 길이`로 응답하며, 프론트는 `deckStatus`로 완료 화면을 복원한다.

#### 단어 완료 처리 — `POST /complete-word`

요청 본문: `{ wordId, isCorrect, timeSpent?, index? }` — `timeSpent`는 초 단위, `index`는 답한 카드의 덱 내 위치(배포 순서 호환을 위해 선택값)

응답 구조는 `CompleteWordResponse` 타입. 분기마다 테스트 케이스가 있다 —
`deckController.test.ts` → `describe('completeWord')`:

| 상황 | 응답 | 테스트 케이스 |
|---|---|---|
| `index`가 서버 위치·단어와 다름 (실패 후 재시도 등) | 409 + `code: "PROGRESS_OUT_OF_SYNC"`, 아무것도 기록하지 않음 | "index가 서버 위치와 다름" |
| 패스 진행 중 | `passComplete: false`, `windowComplete: false` | "성공 - 패스 미완료" |
| 패스 완료 + 모름 단어 있음 | `passComplete: true`, `nextPassSize: N` (서버가 재셔플) | "패스 완료 + 모르는 단어 있음" |
| 패스 완료 + 전부 알았음 | `windowComplete: true` | "패스 완료 + 모두 외움" |

> `windowComplete: true` 수신 후 프론트엔드에서 `POST complete-deck`을 호출해야 다음 윈도우가 생성된다.

#### 덱 완료 및 다음 윈도우 — `POST /complete-deck`

응답: `{ completedDeck: { level, steps, progressType, finalStats, completedAt }, nextWindow, canGenerateNext, isSubLoop }`.
`deckController.test.ts` → `describe('completeDeck')`:

| 상황 | 응답 | 테스트 케이스 |
|---|---|---|
| 윈도우 미완료 | 400 (중복 호출도 여기에 걸린다) | "윈도우 미완료" |
| 메인 + 다음 윈도우 있음 | `nextWindow`, `canGenerateNext: true` | "메인 + 다음 윈도우 있음" |
| 메인 + 레벨의 마지막 윈도우 | `nextWindow: null`, `canGenerateNext: false` → 프론트는 완료 안내와 함께 레벨 선택으로 이동 | "메인 + 레벨의 마지막 윈도우" |
| 서브 | 같은 스텝의 단어 전체로 새 덱(`restartWindow`, 완료 표시 리셋), `isSubLoop: true` → "다시 학습하기" UI | "서브" |

---

### 복습 (`/api/users/me/reviews`)

| 메서드 | 경로 | 용도 |
|---|---|---|
| GET | `/due?limit=N` | 기한이 지난 순서로 N개(기본 50, 최대 100)를 섞어서 반환 + 전체 `dueCount`, 다음 복습 시각 `nextDueAt` |
| POST | `/answer` | `{ wordId, isCorrect, timeSpent? }` → `{ applied, stage, nextReviewAt }`. 기한 전이면 `applied: false`(재전송 무시), 복습에 없는 단어는 404 |

검증: `wordReviewModel.test.ts`(간격·재전송), `learningFlow.int.test.ts` → `describe('간격 복습')`

---

### 북마크 (`/api/users/me/bookmarks`)

```
POST /toggle       # 북마크 토글 (추가/해제)
GET  /             # 북마크 목록 조회
PUT  /:wordId      # 북마크 메모 수정
```

검증: `bookmarkController.test.ts` — 세션 간 일괄 해제, 150개 한도 409, 페이지네이션 포함 · `bookmarkRoutes.test.ts` — 쿼리 검증

#### 북마크 토글

**요청**: `{ wordId, progressType }` — `progressType`은 원래 세션 타입(`"main"` | `"sub"`)을 그대로 전달해야 올바른 레코드가 토글된다.

**응답**: 기본 `{ success, data }`. 잔여 10개 이하면 `warning: { remaining: N }` 추가. 150개 초과 시 409 + `code: "BOOKMARK_LIMIT_EXCEEDED"`.

#### 북마크 목록 조회

**쿼리 파라미터**: `page`(기본 1), `limit`(기본 20, 최대 150 = 북마크 최대 개수 — 복습 페이지가 전체를 한 번에 조회), `level`(N5~N1, daily), `sortBy`(`bookmarked_at` 기본 | `last_studied_at` | `level` | `step`), `sortOrder`(`desc` | `asc`)

**응답**: `{ bookmarks: [...], pagination: { currentPage, itemsPerPage, totalItems, totalPages } }`

각 bookmark 객체는 `word`, `progress_type`, `notes`, `is_bookmarked`, `bookmarked_at` 포함.

---

### 단어 관리 (Words)

```
GET /api/words/level/:level/steps                     # 레벨별 스텝 정보 (minStep, maxStep)
GET /api/words/kanjiSearch?kanji=한자                  # 한자 풀이 (로그인 필요, 네이버 사전 → 실패 시 DB(KANJIDIC2, 한국 한자음만), 네이버 결과만 서버 메모리 캐시)
```

### 운영 (Health)

```
GET /health                                           # DB 연결 확인 — 200 db: "up" / 503 db: "down" (가동률 모니터용)
```

검증: `health.test.ts`

---

## 북마크 시스템

북마크는 `WordProgress.is_bookmarked` 필드로 관리된다. `progress_type`별로 레코드가 분리되므로 토글 시 원래 세션의 `progressType`을 함께 전달해야 올바른 레코드가 토글된다.

### 제한 정책

- 유저당 최대 **150개**. 초과 시 409 `BOOKMARK_LIMIT_EXCEEDED` 반환.
- 잔여 **10개 이하**가 되면 성공 응답에 `warning: { remaining: N }` 포함 → 프론트에서 5초 배너 표시.

### 주요 동작 규칙

| 상황 | 동작 |
|---|---|
| 북마크 추가, 잔여 > 10 | `{ success: true }` |
| 북마크 추가, 잔여 ≤ 10 | `{ success: true, warning: { remaining: N } }` |
| 북마크 추가, 이미 150개 | 409, 저장 안 함 |
| 북마크 해제 | 제한 체크 없이 토글 |
| API 오류 | 낙관적 업데이트 롤백 |

### 구현 참고

- 409 응답의 `code`는 `getErrorCode`(`services/apiClient.ts`)로 읽는다 — `apiClient`는 4xx를 `AxiosError`로 던진다.
- `BookmarkStudyPage`(북마크 학습)는 섞어서 한 바퀴, 몰랐던 단어만 다음 회차로 반복한다. 응답은 서버에 기록하지 않는다. 로딩 시 `progress_type`을 `Map<wordId, ProgressType>`으로 캐싱하여 토글에 전달.
- `BookmarkPage` 필터 변경 시 generation 카운터로 stale 응답을 무시. 삭제 후에는 `fetchBookmarks(targetPage)` 재호출로 서버 상태와 동기화.
- `FlashCardContainer` 북마크 초기 상태는 덱 응답의 `isBookmarked` 필드에서 직접 초기화.

---

## 슬라이딩 윈도우 시스템

### 개념 (아래 임의이 Step수(1~10)는 예시일 뿐 하드코딩을 의미하지 않습니다)

3단계씩 슬라이딩하는 점진적 학습 방식:

```
1-3 → 2-4 → 3-5 → 4-6 → 5-7 → 6-8 → 7-9 → 8-10
```

### 순환 복습 (Circular Review)

레벨의 마지막 스텝에서 처음으로 감기는 윈도우. 동일 레벨 내 순환이며 다른 레벨로 넘어가지 않는다.

```
9-1: steps [9, 10, 1]   (레벨 내 순환)
10-2: steps [10, 1, 2]  (레벨 내 순환)
```

### 윈도우 전환 예시 (N5)

```
윈도우 1: steps 1-3  → 완료
윈도우 2: steps 2-4  → 완료
...
윈도우 8: steps 8-10 → 완료
윈도우 9: steps 9-1  → 완료 (순환)
윈도우 10: steps 10-2 → 완료 (순환) → 레벨 완료
```

### 덱 생성 알고리즘

**파일**: `backend/src/services/slidingWindowService.ts`

1. **단어 조회**: level + steps 범위의 단어 검색
2. **셔플링**: Fisher-Yates 알고리즘 (윈도우 내 모든 단어 포함)
3. **저장**: user_checkpoint shuffled_order 저장

---

## 화면 구성과 학습 플로우

| 경로 | 화면 | 쓰는 API |
|---|---|---|
| `/` | 로그인 전: 소개 + 로그인 버튼 / 로그인 후: 인사·연속 학습일·오늘 학습량, 오늘의 복습, 진도·집중 학습 카드 | `GET /me/progress`, `GET /me/stats` |
| `/start` | 학습 방식 → 레벨 → 범위 → 확인 (진행 중 세션을 바꾸면 무엇이 남는지 안내) | `GET /words/level/:level/steps`, `GET /me/progress`, `DELETE /me/progress/:type`, `PATCH /me/checkpoint`, `PATCH /me/active-progress-type` |
| `/study` | 진도·집중 학습 (활성 세션) | `GET /me/progress/:type/current`, `POST complete-word`, `POST complete-deck` |
| `/review` | 오늘의 복습 | `GET /me/reviews/due`, `POST /me/reviews/answer` |
| `/bookmarks`, `/bookmarks/study` | 북마크 목록·메모, 북마크 학습 | `GET /me/bookmarks`, `POST /me/bookmarks/toggle`, `PUT /me/bookmarks/:wordId` |
| `/stats` | 기록 | `GET /me/stats` |
| `/profile` | 닉네임, 하루 목표, 계정 연동 | `PATCH /me`, `PATCH /me/preferences`, `/api/auth/link/*` |
| `/sources` | 데이터 출처 — KANJIDIC2(EDRDG, CC BY-SA 4.0) 표기. 사용자 메뉴와 로그인 전 첫 화면 아래에서 연결 | 없음 |

### 진도·집중 학습

```
1. /start에서 세션 생성 (PATCH /me/checkpoint, 활성 세션 타입도 함께 변경)
2. GET /me/progress/:type/current → 덱 + window(이번 범위 익힘/전체)
3. 카드마다 POST complete-word { wordId, isCorrect, index } — 요청은 순서대로 하나씩, 실패하면 "다시 불러오기"
   - 처음 "알아요"인 단어는 간격 복습에 등록된다 (다음 날 한국 자정부터)
4. 패스 끝
   - 모름이 남음 → 서버가 모름 단어만 재셔플 → "이어가기"로 덱 재조회
   - 모두 앎 → POST complete-deck → 진도: 다음 윈도우(레벨 끝이면 /start로 완료 안내) / 집중: 같은 스텝 전체로 다시
```

### 오늘의 복습

```
1. GET /me/reviews/due → 기한이 지난 단어(섞어서) + dueCount + nextDueAt
2. 알아요 → 다음 단계 간격 뒤로 / 몰라요 → 0단계, 이번 복습의 맨 뒤로 보내 다시 묻는다
3. 기한 전 응답(재전송)은 서버가 반영하지 않는다 (applied: false)
```

### 키보드 단축키 (학습 카드)

`Space`·`Enter` 공개 · `←` 몰라요 · `→` 알아요 · `R` 요미가나 · `M` 한글 뜻 · `S` 발음 · `B` 북마크 — 입력 중이거나 버튼에 포커스가 있으면 동작하지 않는다.

### Redux Store 구조

```typescript
// store/modules/user.ts
interface UserState {
  isLoggedIn: boolean;
  loginStatusType: 'google' | 'kakao' | 'local' | null;
  email: string | null;
  name?: string;
  activeProgressType: 'main' | 'sub' | null;
}

// store/modules/kanji.ts — 현재 카드에서 연 한자 풀이 목록 (카드가 바뀌면 비운다)
interface KanjiState {
  kanjis: KanjiDataType[];
}
```

Redux는 인증·활성 세션 타입·한자 풀이 목록만 둔다. 덱·복습·북마크·기록은 서비스 레이어로 서버에서 직접 읽는다 (서버가 단일 출처).

---

## 환경 설정

### Backend 환경 변수

**backend/.env**:

```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/kanji

# Server
PORT=8000
NODE_ENV=development

# CORS (콤마 구분, 프론트 도메인 등록)
ALLOWED_ORIGINS=http://localhost:4200

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=1d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4200/auth/google/callback

# Kakao OAuth
KAKAO_REST_API_KEY=your-kakao-rest-api-key
```

전체 목록과 설명은 `backend/.env.example` 참고.

### Frontend 환경 변수

**frontend/.env**:

```bash
# API
REACT_APP_API_URL=http://localhost:8000

# Google OAuth
REACT_APP_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:4200/auth/google/callback

# Kakao OAuth
REACT_APP_KAKAO_REST_API_KEY=your-kakao-rest-api-key
REACT_APP_KAKAO_REDIRECT_URI=http://localhost:4200/auth/kakao/callback
```

전체 목록과 설명은 `frontend/.env.example` 참고.

### 개발 서버 실행

**전체 스택**:

```bash
# 루트 디렉토리에서
yarn start
# Frontend: http://localhost:4200
# Backend: http://localhost:8000
```

**운영 DB 없이** (메모리 MongoDB + 샘플 단어, 종료하면 데이터도 사라짐):

```bash
yarn start:memory
# 시작 로그의 localStorage 한 줄을 브라우저 콘솔에 붙여넣으면 개발용 계정으로 로그인된다
```

**개별 실행**:

```bash
# Backend
cd backend
yarn dev

# Frontend
cd frontend
yarn start
```

### 프로덕션 빌드

```bash
# Backend: tsc → dist/ (테스트·스크립트 제외, tsconfig.build.json)
cd backend
yarn build          # tsc -p tsconfig.build.json
yarn start          # node dist/server.js

# Frontend: CRA 정적 빌드
cd frontend
yarn build          # → frontend/build/
```

### 배포

프론트 = Vercel(`frontend/vercel.json`) · 백엔드 = Render(`render.yaml`) · DB = MongoDB Atlas.
단계별 절차와 OAuth 콜백 등록은 [DEPLOYMENT.md](./DEPLOYMENT.md) 참고.

---

## 부록: 영어 용어 참조

### Core Concepts

- **Sliding Window Deck**: 슬라이딩 윈도우 덱
- **UserCheckpoint**: 세션 상태 + 체크포인트 통합 모델
- **Session**: 세션 (학습 진행 상태)
- **Bookmark**: 북마크 (어려운 단어 표시)
- **Circular Review**: 순환 복습 (레벨 경계 넘김)

### API Terms

- **Progress Type**: 진행 타입 (main | sub)
- **Current Index**: 현재 인덱스 (학습 위치)
- **Shuffled Order**: 셔플된 순서 (단어 배열)
- **Word Progress**: 단어 진행 상황
- **Completion Status**: 완료 상태

### Technical Terms

- **Compound Index**: 복합 인덱스
- **OAuth**: Open Authentication
- **JWT**: JSON Web Token
- **Mongoose**: MongoDB ODM

---

## 변경 이력

### v5.0 (2026-10-24) — 리뉴얼

- ✅ feat: 간격 복습(`word_review`, 1·3·7·14·30·60일) — 처음 "알아요"에 등록, 오늘의 복습 화면(`/review`)
- ✅ feat: 기록 화면(`/stats`) — 익힌 단어·장기 기억·복습 대기·연속 학습일·오늘 학습량, `GET /me/stats` 재설계
- ✅ feat: 오늘 할 일 중심 홈 + 비로그인 소개 화면, 학습 시작 화면 통합(`/start`), 하루 목표 설정
- ✅ feat: 학습 카드 재설계(StudyCard) — 응답 강조, 키보드 단축키, 발음 듣기, 범위 진행, 모바일 한자 시트
- ✅ feat: 북마크 학습 회차 반복, 앱 셸(상단 바·모바일 하단 탭), 디자인 토큰·포커스 표시
- ✅ feat: 데이터 출처 화면(`/sources`) — KANJIDIC2 라이선스(CC BY-SA 4.0)가 요구하는 앱 안 출처 표기
- ✅ refactor: 주소 정리 — `/study`, `/bookmarks`, `/bookmarks/study`, 옛 주소 리다이렉트 삭제
- ✅ fix: 카카오 OAuth state 검증(연동 CSRF), 404 오류 화면, 북마크 한도 안내, 북마크 최근 순 정렬
- ✅ fix: 서브 루프 축소, 새 윈도우 플래그 리셋, 연속 학습일(한국 시간·로그인 무관), 에러 클래스 판별, 세션 고유 인덱스
- ✅ fix: 한자 풀이 대체 경로(KANJIDIC2)가 그 한자가 든 다른 단어의 뜻을 훈으로 붙이던 문제, 대체 결과는 서버 캐시에서 제외
- ✅ perf: 한자 풀이는 누를 때만 조회 + 서버·브라우저 캐시(로그인 필요), 세션 카드는 요약 API로
- ✅ test: 메모리 MongoDB 통합 테스트, 백엔드 테스트 41초 → 3초, E2E 27개
- ✅ chore: 로컬 개발 서버(`yarn start:memory`), 백필 스크립트(`yarn backfill:reviews`)
- ✅ refactor: GET `/me/progress/:type`, 옛 레벨 선택·대시보드·통계 화면과 미사용 의존성 삭제

### v4.5 (2026-07-04)

- ✅ perf: `getCurrentDeck` 단어별 N+1 쿼리 제거 (덱당 40~120회 → 배치 2회 + Map 매칭)
- ✅ perf: `getUserProgress`의 `shuffled_order` populate 제거 (응답 페이로드 경량화)
- ✅ perf: 덱 필터링 O(n×m) `equals` 탐색 → Set 기반 O(n), 조회 범위를 덱 단어로 스코프 제한
- ✅ refactor: 미사용 API 제거 — progress(index/reset/stats), deck(bulk-complete/deck-stats), bookmarks(bulk/search/stats), words(all/step 조회/search/random/statistics)
- ✅ refactor: 미참조 모델 메서드·검증자 대규모 정리 (약 1,700줄 삭제)
- ✅ refactor: Fisher-Yates 셔플 3중 복제 → `utils/shuffle.ts` 통합
- ✅ refactor: `is_window_completed` 리셋 updateMany 3곳 → `resetWindowCompletionForWords` 스태틱 통합
- ✅ refactor(PR): `find().distinct()` → `distinct(field, query)` 표준화 (Gemini 리뷰 반영)

### v4.4 (2026-07-02)

- ✅ 배포 설정 추가: Vercel(프론트, SPA rewrite) + Render(백엔드 블루프린트) + MongoDB Atlas 구성
- ✅ 백엔드 프로덕션 빌드 도입: `tsconfig.build.json` + `yarn build`(tsc → dist) / `yarn start`(node dist)
- ✅ `app.set("trust proxy", 1)` 추가 — 프록시 뒤에서 클라이언트 IP(`req.ip`) 인식 (인증 레이트 리밋이 의존)
- ✅ `.env.example` 실제 코드 기준 재정비 (backend/frontend), 배포 가이드 `docs/DEPLOYMENT.md` 신규 작성

### v4.3 (2026-07-01)

- ✅ `daily` 레벨 추가 — LearningLevel 타입, Word 스키마 enum, LevelSetupPage 항목
- ✅ `Word` 모델에 `frequency` 필드 추가 (빈도 순위, 낮을수록 고빈도, 기본: 9999)
- ✅ 서브 세션 집중 루프: Sub 세션 윈도우 완료 시 다음 윈도우 대신 같은 스텝 재셔플 (`isSubLoop` 응답 추가)
- ✅ 데이터 관리 스크립트 4종 추가 (augmentFrequency, cleanWords, createDailyWords, reorderByFrequency)
- ✅ `useToggleBookmark` 훅 추출: FlashCardContainer·BookmarkStudyPage 중복 로직 통합
- ✅ 메인 페이지 세션 카드 UI 개편 (메인/서브 현재 진도 즉시 확인, 세션 전환 후 진입)
- ✅ 레벨 선택 페이지 3단계 스크롤 UI 개편 + StepGrid 컴포넌트 추가
- ✅ 대시보드에 세션 전환 + 현재 학습 위치 표시 이동 (UserProfilePage에서 분리)
- ✅ 통계 페이지 `/profile/stats`로 분리 (UserStatsPage)
- ✅ 백엔드 모델·인터페이스 미사용 코드 대규모 정리 (Word, WordProgress, middleware)
- ✅ bugfix: StepGrid hover 셀-선택 범위 불일치, handleSelectLevel stale closure, handleSwitchToSub localStorage 직접 접근, completeDeck 실패 시 fetchDeck 차단

### v4.2 (2026-06-29)

- ✅ 북마크 유저당 최대 150개 하드 제한 추가 (초과 시 409 `BOOKMARK_LIMIT_EXCEEDED`)
- ✅ 잔여 10개 이하 시 `warning.remaining` 포함 응답 → 프론트 warning 배너 (5초 자동 소멸)
- ✅ `ApiError` 클래스 도입: 409 에러의 `code` 필드 보존
- ✅ `BookmarkStudyPage`: `progress_type` Map 캐싱으로 토글 시 올바른 세션 타입 전달
- ✅ `BookmarkStudyPage`: useEffect active flag + API 에러 상태 처리
- ✅ `BookmarkPage`: generation 카운터로 필터 변경/언마운트 race condition 방어
- ✅ `BookmarkPage`: 삭제 후 `fetchBookmarks(targetPage)` 재호출로 페이지네이션 완전 동기화
- ✅ `FlashCardContainer`: active flag + 성공 시 항상 `setBookmarkedIds` 갱신 (스탤 상태 방지)
- ✅ `FlashCardPage`: 진행 표시를 `Math.min(index + 1, deck.length)`로 클램프 (11/10 방지)
- ✅ 북마크 시스템 문서 섹션 신규 추가

### v4.1 (2026-06-26)

- ✅ 백엔드 컨트롤러 단위 테스트 추가 (deckController, progressController, bookmarkController — 32개)
- ✅ Playwright E2E 테스트 추가 (로그인, 학습 플로우, 패스/윈도우 완료)
- ✅ API 경로 문서 실제 코드 기준으로 정정 (`/api/users/me/` 접두사)
- ✅ 미구현 확장 API 문서 제거
- ✅ 순환 윈도우 설명 수정 (레벨 내 순환임을 명확히)

### v4.0 (2026-06-22)

- ✅ 학습 철학 기반 완전 습득형 로직 구현
- ✅ `is_completed` → `is_window_completed` (윈도우 범위 완료 플래그)
- ✅ `UserCheckpoint.isCompleted()` = 패스 순회 완료 (인덱스 기반, 유지)
- ✅ `UserCheckpoint.isWindowCompleted()` 추가 (모든 단어 알았음 기반)
- ✅ `UserCheckpoint.reshuffleUnknownWords()` 추가 (모름 단어 재셔플)
- ✅ `generateNextSlidingWindow()` 에서 이전 단어 `is_window_completed` 자동 리셋
- ✅ `completeWord` 응답에 `passComplete`, `windowComplete`, `nextPassSize` 추가
- ✅ `completeDeck` 완료 조건을 인덱스 기반 → `isWindowCompleted` 기반으로 변경
- ✅ `markCompleted()`/`markIncomplete()`의 중복 카운팅 버그 수정
- ✅ 스타일링: Styled Components → Vanilla Extract 마이그레이션 완료
- ✅ 카카오 로그인 구현 완료
- ✅ 핵심 비즈니스 로직 단위 테스트 추가 (slidingWindowService, authService, ProtectedRoute, AuthBannerContext)
- ✅ Redux `redux-actions` → Redux Toolkit `createSlice` 마이그레이션

### v3.0 (2025-01-08)

- ✅ DB 구조 간소화: UserCheckpoint로 통합
- ✅ Checkpoint, LearningProgress 컬렉션 제거
- ✅ CheckpointConfig 제거, updateCheckpoint() 메서드로 대체
- ✅ 체크포인트 정책 단순화: 매 단어마다 저장
- ✅ 불필요한 checkpoint 관련 파일 7개 삭제
- ✅ 환경 변수 간소화
- ✅ 코드베이스 20% 감소

### v2.0 (2025-01-18)

- ✅ UserProgress + Checkpoint 이중 시스템 구축
- ✅ 슬라이딩 윈도우 상세 구현
- ✅ API 엔드포인트 전체 정리
- ✅ 프론트엔드 마이그레이션 가이드

### v1.0 (2025-01-15)

- 초기 문서 작성

---

**작성자**: Claude Code
**문서 위치**: `/PROJECT_DOCS.md`
