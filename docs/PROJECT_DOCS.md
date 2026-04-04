# Kan-ji 프로젝트 문서

> 일본어 단어 학습 애플리케이션 - 슬라이딩 윈도우 덱 시스템

**최종 업데이트**: 2025-01-08
**버전**: 3.0

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 구조](#데이터베이스-구조)
4. [API 엔드포인트](#api-엔드포인트)
5. [슬라이딩 윈도우 시스템](#슬라이딩-윈도우-시스템)
6. [프론트엔드 마이그레이션](#프론트엔드-마이그레이션)
7. [환경 설정](#환경-설정)

---

## 프로젝트 개요

Kan-ji는 일본어 능력시험(JLPT) 단어를 효율적으로 학습하기 위한 풀스택 웹 애플리케이션입니다.

### 핵심 기능

- **슬라이딩 윈도우 덱**: 3단계씩 진행하는 점진적 학습 (1-3 → 2-4 → 3-5)
- **이중 세션**: Main(체계적 학습), Sub(북마크 복습) 독립 관리
- **자동 체크포인트**: 학습 진행 상황 자동 저장 및 복원
- **북마크 시스템**: 어려운 단어 우선 복습
- **진행 상황 추적**: 레벨별, 단계별 학습 완료 상태 관리

### 기술 스택

**Frontend**:

- React 18 + TypeScript
- Redux Toolkit (상태 관리)
- Styled Components
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
│   ├── SelectStep/      # 스텝 선택
│   ├── StepRangeSlider/ # 스텝 범위 슬라이더
│   ├── LoginButton/     # 로그인 버튼 (Google, Kakao, Logout)
│   ├── Navbar/          # 네비게이션 바
│   ├── HeaderSection/   # 헤더 섹션
│   ├── CommonStyled/    # 공통 스타일 컴포넌트
│   ├── UserProgress.tsx # 사용자 진행 상황 표시
│   └── ErrorMessage.tsx # 에러 메시지
├── pages/               # 라우트 레벨 페이지
│   ├── Login/           # 로그인 페이지
│   ├── Main/            # 메인 대시보드 (진행 상황 개요)
│   ├── FlashCardPage/   # 플래시카드 학습 페이지
│   ├── LevelSelectionPage/ # 레벨 선택 페이지
│   ├── UserProfilePage.tsx # 사용자 프로필 (Main/Sub 전환)
│   ├── BookmarkPage.tsx # 북마크 관리 페이지
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
│   └── bookmarkController.ts
├── models/              # Mongoose 스키마
│   ├── User.ts          # 사용자 인증
│   ├── Word.ts          # 단어 마스터 데이터
│   ├── UserCheckpoint.ts  # 세션 상태 + 체크포인트 (통합)
│   └── WordProgress.ts  # 단어별 완료 상태
├── routes/              # Express 라우트
│   ├── authRoutes.ts
│   ├── progressRoutes.ts
│   ├── deckRoutes.ts
│   └── bookmarkRoutes.ts
├── services/            # 비즈니스 로직
│   └── slidingWindowService.ts
└── middleware/          # 커스텀 미들웨어
    └── authMiddleware.ts
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
  type: "google" | "kakao" | "local", // OAuth 제공자 타입 (현재 Google만 구현됨)
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
  level: string,              // N5, N4, N3, N2, N1
  step: number,               // 레벨 내 단계
  means: string[],            // 한국어 뜻
  parts: string[],            // 품사
  createdAt: Date
}
```

**인덱스**:

- `origin_entry_id: 1` (unique)
- `{ level: 1, step: 1 }` (복합)

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

- `isCompleted()` - 세션 완료 여부
- `getCurrentWord()` - 현재 학습할 단어
- `moveToNext()` - 다음 단어로 이동
- `updateCheckpoint()` - 체크포인트 업데이트 (명시적 저장)
- `generateNextSlidingWindow()` - 다음 윈도우 생성

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
  is_completed: boolean,      // 완료 여부
  try_count: number,          // 시도 횟수
  correct_count: number,      // 정답 횟수
  is_bookmarked: boolean,     // 북마크 여부 (세션 간 공유)

  // 시간 추적
  last_studied_at?: Date,     // 마지막 학습 시간
  first_studied_at?: Date,    // 처음 학습 시간

  // 학습 통계
  study_streak: number,       // 연속 정답 횟수 (기본: 0)
  time_spent_total: number,   // 총 학습 시간 (초, 기본: 0)

  // 북마크 상세 정보
  bookmark_reason?: string,   // 북마크 이유 (최대 200자)
  bookmark_tags: string[],    // 북마크 태그 배열

  // 학습 히스토리
  study_history: [{           // 학습 기록 배열 (최대 50개)
    isCorrect: boolean,
    timeSpent?: number,       // 소요 시간 (초)
    studiedAt: Date
  }],

  created_at: Date
  // updated_at 미사용 (last_studied_at 사용)
}
```

**인덱스**:

- `{ user_id: 1, progress_type: 1 }` (복합)
- `{ user_id: 1, word_id: 1, progress_type: 1 }` (unique, 복합)
- `{ user_id: 1, is_bookmarked: 1 }` (복합)
- `{ user_id: 1, is_completed: 1, progress_type: 1 }` (복합)
- `word_id: 1`
- `last_studied_at: 1`

**특징**:

- `is_bookmarked`는 progress_type과 무관하게 공유됨
- Main에서 북마크한 단어는 Sub에서도 북마크 상태

---

## API 엔드포인트

### 인증 (Authentication)

#### Google OAuth

```
GET  /auth/google              # OAuth 시작
GET  /auth/google/callback     # OAuth 콜백
POST /auth/logout              # 로그아웃
GET  /auth/me                  # 현재 사용자 정보
```

---

### 진행 상황 관리 (Progress - 확장 API)

#### 전체 세션 조회

```
GET /api/progress
```

- 사용자의 모든 활성 세션 조회 (main, sub)

#### 종합 학습 통계

```
GET /api/progress/stats
```

- 레벨별 진행률, 연속 학습일, 총 학습 시간 등 종합 통계

#### 세션 타입 전환

```
POST /api/progress/switch
```

- User의 activeProgressType 업데이트
- 요청 본문: `{ "fromType": "main", "toType": "sub" }`

#### 체크포인트 명시적 업데이트

```
POST /api/progress/updateCheckpoint
```

- 체크포인트 수동 저장
- 요청 본문: `{ "progressCheckpoint": { ... } }`

#### 단어 인덱스 조작

```
PUT /api/progress/:type/index
```

- 현재 학습 위치 이동 (next/previous/jump)
- 요청 본문: `{ "action": "next" | "previous" | "jump", "index": 10 }`

#### 세션 리셋

```
PUT /api/progress/:type/reset
```

- current_index를 0으로 초기화

#### 다음 윈도우 생성

```
POST /api/progress/:type/next-window
```

- 현재 윈도우 완료 후 다음 슬라이딩 윈도우 자동 생성

#### 독립 덱 생성

```
POST /api/progress/generate
```

- 세션 생성과 별개로 덱만 생성
- 고급 필터링 옵션 지원

#### 덱 통계 조회

```
GET /api/progress/:type/deck-stats
```

- 현재 덱의 상세 통계 (완료율, 북마크 수, 평균 정답률 등)

#### 단어 일괄 완료

```
POST /api/progress/:type/bulk-complete
```

- 여러 단어를 한 번에 완료 처리
- 오프라인 학습 후 동기화에 유용

---

### 진행 상황 관리 (Progress - 메인 시스템)

#### 세션 조회

```
GET /api/progress/:type
```

- `type`: "main" | "sub"
- 현재 활성 세션 조회
- 없으면 체크포인트에서 자동 복원

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "session": {
      "user_id": "...",
      "progress_type": "main",
      "current_level": "N5",
      "steps": { "start": 1, "end": 3 },
      "shuffled_order": ["...", "..."],
      "current_index": 5
    },
    "sessionStats": {
      "totalWords": 50,
      "completedWords": 5,
      "remainingWords": 45,
      "progressPercentage": 10,
      "isCompleted": false
    },
    "restoredFromCheckpoint": false
  }
}
```

#### 세션 생성

```
POST /api/progress/:type
```

**요청 본문**:

```json
{
  "level": "N5",
  "steps": { "start": 1, "end": 3 },
  "options": {
    "excludeCompleted": true, // 완료된 단어 제외
    "prioritizeBookmarked": true // 북마크 우선 배치
  }
}
```

**응답 예시**:

```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "session": {
      /* UserProgress */
    },
    "sessionStats": {
      /* 통계 */
    },
    "deckSize": 48
  }
}
```

#### 세션 삭제

```
DELETE /api/progress/:type
```

---

### 덱 관리 (Deck)

#### 현재 덱 조회

```
GET /api/progress/:progressType/current
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "words": [
      {
        "_id": "...",
        "entry": "こんにちは",
        "pron": "今日は",
        "means": ["안녕하세요"],
        "parts": ["감탄사"],
        "level": "N5",
        "step": 1
      }
    ],
    "currentIndex": 5,
    "currentWord": {
      /* 현재 단어 */
    },
    "sessionStats": {
      "totalWords": 50,
      "completedWords": 5,
      "remainingWords": 45,
      "progressPercentage": 10
    }
  }
}
```

#### 단어 완료 처리

```
POST /api/progress/:progressType/complete-word
```

**요청 본문**:

```json
{
  "wordId": "64f5a1b2c3d4e5f6g7h8i9j0",
  "isCorrect": true, // 정답 여부
  "timeSpent": 15 // 소요 시간 (초)
}
```

**응답 예시**:

```json
{
  "success": true,
  "message": "Word marked as completed",
  "data": {
    "currentIndex": 6,
    "totalWords": 50,
    "remainingWords": 44,
    "isSessionCompleted": false,
    "nextWord": {
      /* 다음 단어 */
    }
  }
}
```

**자동 체크포인트**:

- 매 단어 완료 시: 항상 저장
- 덱 완료 시: 저장
- 윈도우 전환 시: 저장

#### 덱 완료 및 다음 윈도우

```
POST /api/progress/:progressType/complete-deck
```

**요청 본문**:

```json
{
  "autoGenerateNext": true // 다음 윈도우 자동 생성
}
```

**응답 예시**:

```json
{
  "success": true,
  "message": "Deck completed",
  "data": {
    "completedWindow": {
      "level": "N5",
      "steps": { "start": 1, "end": 3 }
    },
    "nextWindow": {
      "level": "N5",
      "steps": { "start": 2, "end": 4 },
      "isCircular": false
    },
    "stats": {
      "wordsCompleted": 50,
      "windowsCompleted": 1
    }
  }
}
```

---

### 북마크 관리 (Bookmarks)

#### 북마크 토글

```
POST /api/bookmarks/toggle
```

**요청 본문**:

```json
{
  "wordId": "64f5a1b2c3d4e5f6g7h8i9j0",
  "progressType": "main" // 선택 (기본값: "main")
}
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "wordId": "...",
    "isBookmarked": true
  }
}
```

#### 북마크 목록 조회

```
GET /api/bookmarks?level=N5&sortBy=recent&limit=50
```

**쿼리 파라미터**:

- `level`: 레벨 필터 (선택)
- `sortBy`: 정렬 방식 (recent | alphabetical)
- `limit`: 개수 제한 (기본값: 50)

---

### 단어 관리 (Words)

#### 모든 단어 조회

```
GET /api/words/all
```

#### 레벨별 단어 조회 (레거시)

```
GET /api/words/level/:level
```

- 400+ 단어를 한 번에 조회하므로 성능상 비권장
- 대신 스텝 범위 조회 사용 권장

#### 레벨별 스텝 정보

```
GET /api/words/level/:level/steps
```

- 해당 레벨의 minStep, maxStep, totalWords 반환

#### 레벨+스텝별 단어 조회

```
GET /api/words/level/:level/step/:step
```

- 쿼리 파라미터: `limit`, `page`, `sortBy`, `sortOrder`

#### 스텝 범위로 단어 조회

```
GET /api/words/level/:level/steps/:startStep-:endStep
GET /api/words/step-range?startStep=1&endStep=3&level=N5
```

- 슬라이딩 윈도우 지원 (includeSlidingWindow=true)
- 레벨 경계 넘김 지원 (예: N5 steps 9-1)

#### 고급 단어 검색

```
POST /api/words/search
```

- 다중 조건 검색 (level, step, searchTerm, partsOfSpeech 등)

#### 랜덤 단어 조회

```
POST /api/words/random
```

- 퀴즈 생성 등에 활용

#### 단어 통계

```
GET /api/words/statistics
GET /api/words/statistics/:level
```

- 레벨별 총 단어 수, 스텝 정보 등

#### 한자 검색 (네이버 사전 API)

```
GET /api/words/kanjiSearch?query=漢字
```

- 네이버 한자사전 API 통합

---

### 북마크 관리 (Bookmarks - 확장)

#### 북마크 상세 정보 수정

```
PUT /api/bookmarks/:wordId
```

- 북마크 이유 및 태그 업데이트
- 요청 본문: `{ "reason": "발음 어려움", "tags": ["발음", "복습필요"] }`

#### 일괄 북마크 작업

```
POST /api/bookmarks/bulk
```

- 최대 100개 단어 동시 처리
- 요청 본문: `{ "wordIds": [...], "action": "bookmark" | "unbookmark" }`

#### 북마크 통계 및 분석

```
GET /api/bookmarks/stats?progressType=main
```

- 총 북마크 수, 완료율, 레벨별 분포, 태그 통계 등

#### 고급 북마크 검색

```
POST /api/bookmarks/search
```

- 다중 조건 필터링 (searchTerm, level, step, tags, isCompleted 등)
- 정렬 및 페이징 지원

---

## 슬라이딩 윈도우 시스템

### 개념 (아래 임의이 Step수(1~10)는 예시일 뿐 하드코딩을 의미하지 않습니다)

3단계씩 슬라이딩하는 점진적 학습 방식:

```
1-3 → 2-4 → 3-5 → 4-6 → 5-7 → 6-8 → 7-9 → 8-10
```

### 순환 복습 (Circular Review)

레벨 경계를 넘어가는 윈도우:

```
9-1: steps [9, 10, 1]  (현재 레벨 9,10 + 다음 레벨 1)
10-2: steps [10, 1, 2] (현재 레벨 10 + 다음 레벨 1,2)
```

### 윈도우 전환 예시

**N5 레벨 -**:

```
덱 1: steps 1-3  (50 words) → 완료
덱 2: steps 2-4  (48 words) → 완료
덱 3: steps 3-5  (52 words) → 완료
...
덱 8: steps 8-10 (45 words) → 완료
```

**N4 레벨로 전환**:

```
덱 9: N5 steps 9-10 + N4 step 1  (순환)
덱 10: N5 step 10 + N4 steps 1-2 (순환)
덱 11: N4 steps 1-3  (정규)
```

### 덱 생성 알고리즘

**파일**: `backend/src/services/slidingWindowService.ts`

1. **단어 조회**: level + steps 범위의 단어 검색
2. **필터링**: 완료된 단어 제외 (선택)
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

### 현재 상태 (2025-01-18 기준)

#### ✅ 완료된 작업

1. **API 서비스 레이어**:
   - `frontend/src/services/apiClient.ts` - HTTP 클라이언트
   - `frontend/src/services/progressService.ts` - Progress API
   - `frontend/src/services/deckService.ts` - Deck API
   - `frontend/src/services/bookmarkService.ts` - Bookmark API
   - TypeScript 타입 정의 완료

#### ✅ 완료된 작업 (계속)

2. **Redux Store 구조**:
   - `user.ts` - 사용자 인증 및 activeProgressType 관리
   - `kanji.ts` - 한자 조회 데이터
   - Services 레이어로 Checkpoint/Deck/Bookmark 관리

3. **컴포넌트 구현**:
   - ✅ FlashCardPage - 플래시카드 학습 페이지
   - ✅ LevelSelectionPage - 레벨 선택 페이지
   - ✅ UserProgress.tsx - 진행 상황 표시 컴포넌트
   - ✅ UserProfilePage - 사용자 프로필 및 Main/Sub 세션 전환
   - ✅ SelectLevel, SelectStep, StepRangeSlider - 레벨/스텝 선택 UI
   - ✅ FlashCard, FlashCardContainer, ControlPanel - 학습 인터페이스
   - ✅ Kanji 컴포넌트 (KanjiCard, KanjiRead, KanjiExample)

#### 🔄 진행 중

4. **고도화 작업**:
   - 학습 통계 대시보드 고도화
   - 연속 학습일 추적 UI

### 마이그레이션 전략

#### 레거시 vs 신규 API

**레거시 (제거 예정)**:

```typescript
// ❌ 레벨의 모든 단어 조회
GET /api/words/level/${level}
// 400+ words 조회 → 클라이언트에서 필터링/셔플
```

**신규 (권장)**:

```typescript
// ✅ 세션 기반 덱 조회
GET / api / deck / main / current;
// 40-120 words (3-step window)
// 서버에서 필터링, 셔플, 북마크 우선순위 처리 완료
```

### 학습 플로우

**신규 플로우**:

```
1. 앱 진입
2. GET /api/progress/main → 세션 존재 확인
   - 있으면: 기존 세션 로드 (체크포인트 복원)
   - 없으면: 세션 생성 UI 표시
3. POST /api/progress/main → 세션 생성
   - level: "N5"
   - steps: { start: 1, end: 3 }
4. GET /api/progress/main/current → 덱 로딩
5. 학습 시작:
   - POST /api/progress/main/complete-word (단어마다)
   - 자동 체크포인트 저장
6. 덱 완료:
   - POST /api/progress/main/complete-deck
   - 다음 윈도우 자동 생성 (steps 2-4)
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
  learningStats: LevelStatistics[];  // 레벨별 학습 통계
  learningStreak: number;             // 연속 학습일
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

**서비스 레이어 활용 예시**:
```typescript
// FlashCardPage에서 직접 서비스 호출
import { progressService, deckService } from 'services';

// 세션 조회
const session = await progressService.getProgress('main');

// 현재 덱 조회
const deck = await deckService.getCurrentDeck('main');

// 단어 완료
await deckService.completeWord('main', wordId, isCorrect, timeSpent);
```

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

# Authentication
SESSION_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend 환경 변수

**frontend/.env**:

```bash
# API
REACT_APP_API_URL=http://localhost:8000

# OAuth
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

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
- **updateCheckpoint()**: 체크포인트 업데이트 메서드

### Technical Terms

- **Compound Index**: 복합 인덱스
- **OAuth**: Open Authentication
- **JWT**: JSON Web Token
- **Mongoose**: MongoDB ODM

---

## 변경 이력

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
