# kanji 프로젝트 문서

> 일본어 단어 학습 애플리케이션 - 슬라이딩 윈도우 덱 시스템

**최종 업데이트**: 2026-07-04
**버전**: 4.5

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 구조](#데이터베이스-구조)
4. [API 엔드포인트](#api-엔드포인트)
5. [북마크 시스템](#북마크-시스템)
6. [슬라이딩 윈도우 시스템](#슬라이딩-윈도우-시스템)
7. [프론트엔드 마이그레이션](#프론트엔드-마이그레이션)
8. [환경 설정](#환경-설정)

---

## 프로젝트 개요

kanji는 일본어 능력시험(JLPT) 단어를 효율적으로 학습하기 위한 풀스택 웹 애플리케이션입니다.

### 핵심 기능

- **슬라이딩 윈도우 덱**: 3단계씩 진행하는 점진적 학습 (1-3 → 2-4 → 3-5)
- **이중 세션**: Main(체계적 슬라이딩 윈도우), Sub(단일 스텝 집중 반복) 독립 관리
- **서브 세션 집중 루프**: Sub 세션 완료 시 다음 윈도우로 이동하지 않고 같은 스텝을 재셔플해 반복 학습
- **daily 레벨**: 시험 무관 생활 필수 어휘 카테고리 (N5~N1 외 별도 관리)
- **자동 체크포인트**: 학습 진행 상황 자동 저장 및 복원
- **북마크 시스템**: 어려운 단어 우선 복습
- **진행 상황 추적**: 레벨별, 단계별 학습 완료 상태 관리

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
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── FlashCard/       # 플래시카드 UI
│   ├── FlashCardContainer/ # 플래시카드 컨테이너
│   ├── Kanji/           # 한자 관련 컴포넌트 (KanjiCard, KanjiRead, KanjiExample)
│   ├── OriginWord/      # 원형 단어 표시
│   ├── ControlPanel/    # 학습 컨트롤 패널
│   ├── SelectLevel/     # 레벨 선택
│   ├── SelectStep/      # 스텝 선택 (StepGrid/슬라이더 분기 포함)
│   ├── StepGrid/        # 스텝 선택 그리드 (터치 기기용)
│   ├── StepRangeSlider/ # 스텝 범위 슬라이더 (포인터 기기용)
│   ├── LoginButton/     # 로그인 버튼 (Google, Kakao, Logout)
│   ├── Navbar/          # 네비게이션 바
│   ├── HeaderSection/   # 헤더 섹션
│   ├── CommonStyled/    # 공통 스타일 컴포넌트
│   ├── UserProgress.tsx # 사용자 진행 상황 표시
│   └── ErrorMessage.tsx # 에러 메시지
├── hooks/               # 커스텀 훅
│   └── useToggleBookmark.ts # 북마크 토글 (낙관적 업데이트 + 롤백)
├── pages/               # 라우트 레벨 페이지
│   ├── Login/           # 로그인 페이지
│   ├── Main/            # 메인 페이지 (메인/서브 세션 카드 선택)
│   ├── FlashCardPage/   # 플래시카드 학습 페이지
│   ├── LevelSelectionPage/ # 레벨·범위 선택 (3단계 스크롤 UI)
│   ├── DashboardPage/   # 진도 대시보드 (현재 위치, 세션 전환, 레벨별 통계)
│   ├── UserProfilePage.tsx # 사용자 프로필 (계정 연동)
│   ├── UserStatsPage/   # 학습 통계 상세 페이지 (/profile/stats)
│   ├── BookmarkPage/    # 북마크 관리 페이지 (레벨 필터, 정렬, 페이지네이션)
│   ├── BookmarkStudyPage/ # 북마크 복습 플래시카드 페이지
│   └── NotFound/        # 404 페이지
├── store/               # Redux 스토어
│   └── modules/
│       ├── user.ts      # 사용자 상태 (로그인, activeProgressType)
│       └── kanji.ts     # 한자 데이터 (한자 조회용)
├── services/            # API 서비스 레이어
│   ├── apiClient.ts     # 공통 HTTP 클라이언트
│   ├── authService.ts   # 인증 서비스
│   ├── progressService.ts # Progress/Checkpoint API
│   ├── deckService.ts   # Deck 생성 및 관리 API
│   ├── bookmarkService.ts # 북마크 API
│   ├── userService.ts   # 사용자 관리 API
│   ├── types.ts         # TypeScript 타입 정의
│   └── index.ts         # 서비스 통합 export
└── utils/               # 유틸리티 함수
```

**주요 특징**:
- Redux 스토어는 `user`와 `kanji` 두 개의 모듈로만 구성
- Checkpoint/Deck/Bookmark 상태는 Services 레이어에서 API로 관리
- 서비스 레이어가 모든 API 통신 담당
- 컴포넌트는 재사용 가능한 단위로 모듈화


### Backend 구조

```
backend/src/
├── controllers/         # 요청 핸들러
│   ├── authController.ts
│   ├── progressController.ts
│   ├── deckController.ts
│   ├── bookmarkController.ts
│   ├── userController.ts
│   ├── userStatsController.ts
│   └── wordController.ts
├── models/              # Mongoose 스키마
│   ├── user.ts          # 사용자 인증
│   ├── word.ts          # 단어 마스터 데이터
│   ├── userCheckpoint.ts  # 세션 상태 + 체크포인트 (통합)
│   └── wordProgress.ts  # 단어별 완료 상태
├── routes/              # Express 라우트
│   ├── authRoutes.ts
│   ├── progressRoutes.ts
│   ├── bookmarkRoutes.ts
│   ├── userRoutes.ts
│   └── wordRoutes.ts
├── scripts/             # 데이터 관리 스크립트 (일회성 실행용)
│   ├── augmentFrequency.ts   # frequency 필드 외부 데이터로 보강
│   ├── cleanWords.ts         # 중복·불량 단어 정리
│   ├── createDailyWords.ts   # daily 레벨 단어 생성
│   └── reorderByFrequency.ts # 빈도 기준 step 재정렬
├── services/            # 비즈니스 로직
│   └── slidingWindowService.ts
└── middleware/          # 커스텀 미들웨어
    └── auth.ts
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
    levelsCompleted: string[],   // 완료한 레벨 (N5, N4, N3, N2, N1)
    averageSessionTime: number,  // 평균 세션 시간 (초, 기본: 0)
    studyDaysCount: number,      // 학습한 일수 (기본: 0)
    favoriteStudyTime?: string,  // 선호 학습 시간
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

> `daily` 레벨은 JLPT 시험 무관 생활 필수 어휘. `frequency` 기반으로 step이 재정렬되므로 낮은 step일수록 고빈도 단어.

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
- `generateNextSlidingWindow(userId, progressType)` - 다음 윈도우 생성 + 이전 단어 `is_window_completed` 리셋
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

## API 엔드포인트

모든 인증 필요 엔드포인트는 `/api/users/me/` 하위에 위치합니다.

### 인증 (Authentication)

```
GET  /api/auth/google              # OAuth 시작
GET  /api/auth/google/callback     # OAuth 콜백
POST /api/auth/logout              # 로그아웃
GET  /api/auth/me                  # 현재 사용자 정보
```

---

### 사용자 설정

```
PATCH /api/users/me/active-progress-type   # 활성 세션 타입 변경 (main|sub)
PATCH /api/users/me/checkpoint             # 체크포인트 저장
```

---

### 진행 상황 관리 (Progress)

#### 세션 목록 조회

```
GET /api/users/me/progress
```

#### 세션 생성

```
POST /api/users/me/progress
```

**요청 본문**:

```json
{
  "type": "main",
  "level": "N5",
  "steps": { "start": 1, "end": 3 }
}
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "session": { "...": "..." },
    "sessionStats": { "totalWords": 48, "...": "..." },
    "deckSize": 48
  }
}
```

#### 세션 조회

```
GET /api/users/me/progress/:type
```

- `type`: `"main"` | `"sub"`

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "session": {
      "progress_type": "main",
      "current_level": "N5",
      "steps": { "start": 1, "end": 3 },
      "current_index": 5
    },
    "sessionStats": {
      "totalWords": 50,
      "completedWords": 5,
      "remainingWords": 45,
      "progressPercentage": 10,
      "currentStep": 1,
      "totalSteps": 3,
      "averageWordsPerStep": 16.7
    }
  }
}
```

#### 세션 삭제

```
DELETE /api/users/me/progress/:type
```

---

### 덱 관리 (Deck)

#### 현재 덱 조회

```
GET /api/users/me/progress/:progressType/current
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "deckId": "userId-main",
    "level": "N5",
    "steps": { "start": 1, "end": 3 },
    "progressType": "main",
    "words": [
      {
        "_id": "...",
        "entry": "こんにちは",
        "pron": "今日は",
        "means": ["안녕하세요"],
        "parts": ["감탄사"],
        "level": "N5",
        "step": 1,
        "index": 0,
        "isCurrent": false,
        "isWindowCompleted": false,
        "isBookmarked": false
      }
    ],
    "currentIndex": 5,
    "sessionStats": {
      "totalWords": 50,
      "completedWords": 5,
      "remainingWords": 45,
      "progressPercentage": 10,
      "currentStep": 1,
      "totalSteps": 3,
      "averageWordsPerStep": 16.7
    },
    "deckStatus": {
      "isPassComplete": false,
      "isWindowComplete": false,
      "canMoveToNext": false,
      "completionPercentage": 10
    }
  }
}
```

#### 단어 완료 처리

```
POST /api/users/me/progress/:progressType/complete-word
```

**요청 본문**:

```json
{
  "wordId": "64f5a1b2c3d4e5f6g7h8i9j0",
  "isCorrect": true, // 정답 여부
  "timeSpent": 15 // 소요 시간 (초)
}
```

**응답 예시 (패스 진행 중)**:

```json
{
  "success": true,
  "data": {
    "completion": { "wordId": "...", "isCorrect": true },
    "wordProgress": { "totalAttempts": 3, "successRate": 66, "masteryLevel": "learning" },
    "currentIndex": 6,
    "passComplete": false,
    "windowComplete": false
  }
}
```

**응답 예시 (패스 완료, 모름 단어 있음 → 재셔플)**:

```json
{
  "success": true,
  "data": {
    "completion": { "wordId": "...", "isCorrect": false },
    "wordProgress": { "totalAttempts": 3, "successRate": 33, "masteryLevel": "beginner" },
    "currentIndex": 0,
    "passComplete": true,
    "windowComplete": false,
    "nextPassSize": 12
  }
}
```

**응답 예시 (윈도우 완료)**:

```json
{
  "success": true,
  "data": {
    "completion": { "wordId": "...", "isCorrect": true },
    "wordProgress": { "totalAttempts": 2, "successRate": 100, "masteryLevel": "mastered" },
    "currentIndex": 0,
    "passComplete": true,
    "windowComplete": true
  }
}
```

> `windowComplete: true` 수신 후 프론트엔드에서 `POST complete-deck` 호출하여 다음 윈도우 진행

#### 덱 완료 및 다음 윈도우

```
POST /api/users/me/progress/:progressType/complete-deck
```

**응답 예시 (메인 세션 — 다음 윈도우로 이동)**:

```json
{
  "success": true,
  "data": {
    "completedWindow": { "level": "N5", "steps": { "start": 1, "end": 3 } },
    "nextWindow": { "level": "N5", "steps": { "start": 2, "end": 4 }, "deckSize": 50 },
    "canGenerateNext": true,
    "isSubLoop": false,
    "stats": { "wordsCompleted": 50, "windowsCompleted": 1 }
  }
}
```

**응답 예시 (서브 세션 — 같은 스텝 재셔플 루프)**:

```json
{
  "success": true,
  "data": {
    "completedWindow": { "level": "N5", "steps": { "start": 2, "end": 2 } },
    "nextWindow": { "level": "N5", "steps": { "start": 2, "end": 2 }, "deckSize": 16 },
    "canGenerateNext": false,
    "isSubLoop": true,
    "stats": { "wordsCompleted": 16, "windowsCompleted": 1 }
  }
}
```

> **서브 세션 루프**: Sub 세션은 `canMoveToNext = false`일 때 다음 윈도우로 이동하지 않고 동일 스텝의 `is_window_completed`를 초기화한 뒤 재셔플한다. `isSubLoop: true` 수신 시 프론트엔드는 "다시 학습하기" UI를 표시한다.

---

### 북마크 관리 (Bookmarks)

```
POST /api/users/me/bookmarks/toggle   # 북마크 토글 (추가/해제)
GET  /api/users/me/bookmarks          # 북마크 목록 조회
PUT  /api/users/me/bookmarks/:wordId  # 북마크 메모 수정
```

#### 북마크 토글

**요청**: `{ wordId, progressType }` — `progressType`은 원래 세션 타입(`"main"` | `"sub"`)을 그대로 전달해야 올바른 레코드가 토글된다.

**응답**: 기본 `{ success, data }`. 잔여 10개 이하면 `warning: { remaining: N }` 추가. 150개 초과 시 409 + `code: "BOOKMARK_LIMIT_EXCEEDED"`.

#### 북마크 목록 조회

**쿼리 파라미터**: `page`(기본 1), `limit`(기본 20, 최대 150 = 북마크 최대 개수), `level`(N5~N1), `sortBy`(`last_studied_at` | `level` | `step`), `sortOrder`(`desc` | `asc`)

**응답**: `{ bookmarks: [...], pagination: { currentPage, itemsPerPage, totalItems, totalPages } }`

각 bookmark 객체는 `word`, `progress_type`, `notes`, `is_bookmarked`, `bookmarked_at` 포함.

---

### 단어 관리 (Words)

```
GET /api/words/level/:level/steps                     # 레벨별 스텝 정보 (minStep, maxStep)
GET /api/words/kanjiSearch?kanji=한자                  # 한자 상세 검색 (네이버 API)
```

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

- `ApiError` 클래스(`services/authService.ts`)가 409 응답의 `code` 필드를 보존 — `apiClient`가 4xx를 모두 throw로 변환하기 때문에 필요.
- `BookmarkStudyPage`는 로딩 시 `progress_type`을 `Map<wordId, ProgressType>`으로 캐싱하여 토글에 전달.
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
2. **필터링**: 윈도우 내 모든 단어 포함 (`excludeCompleted: false`가 기본값)
3. **북마크 우선순위**: 북마크된 단어를 앞쪽 40%에 배치
4. **셔플링**: Fisher-Yates 알고리즘
5. **저장**: user_checkpoint shuffled_order 저장

**북마크 우선순위 전략**:

```
┌─────────────────────────────────────┐
│  Priority Zone (40%)                │
│  2:1 비율 - 북마크 : 일반           │
│  ├─ 북마크 1                        │
│  ├─ 북마크 2                        │
│  ├─ 일반 1                          │
│  ├─ 북마크 3                        │
│  ├─ 북마크 4                        │
│  └─ 일반 2                          │
├─────────────────────────────────────┤
│  Remaining Zone (60%)               │
│  나머지 단어들 (셔플)               │
│  ├─ 랜덤 단어 1                     │
│  ├─ 북마크 5 (오버플로우)           │
│  ├─ 랜덤 단어 2                     │
│  └─ ...                             │
└─────────────────────────────────────┘
```

---

## 프론트엔드 마이그레이션

### 현재 상태 (2026-07-01 기준)

#### ✅ 완료된 작업

1. **API 서비스 레이어**: 인증, 진행상황, 덱, 북마크, 사용자 서비스 및 TypeScript 타입 정의
2. **Redux Store**: 인증 상태 + 활성 세션 타입만 관리. API 상태는 서비스 레이어로 분리
3. **핵심 컴포넌트**: FlashCard, FlashCardContainer, ControlPanel, LevelSetup, Bookmark 등
4. **완전 습득형 학습 로직**: 패스 반복 + 윈도우 완료 판정 + 재셔플 흐름
5. **북마크 시스템 고도화**: 제한(150개) + warning 알림 + progress_type 보존 + race condition 방어
6. **북마크 복습 페이지**: `BookmarkStudyPage` — 레벨/정렬 필터 기반 플래시카드 복습
7. **테스트**: 백엔드 컨트롤러 단위 테스트, Playwright E2E 테스트
8. **서브 세션 집중 루프**: Sub 세션 완료 시 재셔플 반복 학습
9. **daily 레벨**: 생활 필수 어휘 카테고리 + 데이터 관리 스크립트
10. **메인/레벨선택/대시보드 UI 개편**: 세션 카드 선택, 3단계 스크롤 레벨 선택, 진도 표시 통합
11. **StepGrid**: 터치 기기용 스텝 선택 그리드 (포인터 기기는 슬라이더 유지)
12. **통계 페이지 분리**: `/profile/stats` 라우트에 UserStatsPage 독립

#### 🔄 진행 중

- 학습 통계 대시보드(UserStatsPage) 상세 구현
- 연속 학습일 추적 UI

### 마이그레이션 전략

#### 레거시 vs 신규 API

**덱 조회 (권장)**:

```
GET /api/users/me/progress/:type/current   → 40-120 단어 (3-step window), 서버 셔플 완료
```

### 학습 플로우

**학습 플로우**:

```
1. 앱 진입
2. GET /api/users/me/progress/main → 세션 존재 확인
   - 없으면: 세션 생성 UI 표시
3. POST /api/users/me/progress → 세션 생성 (type, level, steps)
4. GET /api/users/me/progress/main/current → 덱 로딩
5. 패스 시작:
   - POST /api/users/me/progress/main/complete-word (단어마다 알았음/모름 제출)
   - 응답에 passComplete, windowComplete 포함
6. 패스 완료 처리:
   - passComplete=true, windowComplete=false → 서버 자동 재셔플
     프론트엔드: 새 패스 시작 UI 표시 (nextPassSize 활용)
   - passComplete=true, windowComplete=true → 윈도우 완료
     POST /api/users/me/progress/main/complete-deck → 다음 윈도우 생성
7. 반복
```

### Redux Store 구조 (실제 구현)

```typescript
// store/modules/user.ts
interface UserState {
  isLoggin: boolean;
  loginStatusType: 'google' | 'kakao' | 'local' | null;
  email: string | null;
  name?: string;
  activeProgressType: 'main' | 'sub' | null;
}

// store/modules/kanji.ts
interface KanjiStoreState {
  kanjis: KanjiDataType[];  // 한자 상세 조회 데이터
}

export interface KanjiDataType {
  level: string;
  kanji: string;          // 한자 문자
  onRead?: string;        // 음독
  kunRead?: string;       // 훈독
  koreanPron: string;     // 한국 발음
  means: Mean[];          // 의미 및 예문
}
```

**설계 철학**:
- **Redux는 최소한의 전역 상태만 관리**: 사용자 인증 및 한자 조회 데이터
- **Checkpoint/Deck/Bookmark는 Services로 관리**: API 호출을 통해 직접 서버와 통신
- **장점**:
  - 상태 동기화 문제 감소 (서버가 single source of truth)
  - Redux 보일러플레이트 최소화
  - 컴포넌트에서 서비스 직접 호출로 간결한 코드

**서비스 레이어 원칙**: 컴포넌트에서 서비스를 직접 호출하며, Redux 액션을 거치지 않는다.

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
- ✅ `app.set("trust proxy", 1)` 추가 — 프록시 뒤 secure 세션 쿠키 동작 보장
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
