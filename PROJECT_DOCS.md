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
│   ├── FlashCard/       # 학습 인터페이스
│   ├── Dashboard/       # 진행 상황 대시보드
│   ├── Bookmark/        # 북마크 관리
│   └── ControlPanel/    # 학습 컨트롤
├── pages/               # 라우트 레벨 페이지
│   ├── LoginPage        # 로그인
│   ├── DashboardPage    # 메인 대시보드
│   ├── StudyPage        # 학습 페이지
│   ├── BookmarkPage     # 북마크 관리
│   └── ProfilePage      # 프로필 (Main/Sub 전환)
├── store/               # Redux 스토어
│   ├── checkpoint/      # UserCheckpoint 상태
│   ├── deck/            # 현재 덱 상태
│   └── bookmarks/       # 북마크 상태
├── services/            # API 서비스 레이어
│   ├── apiClient.ts     # 공통 HTTP 클라이언트
│   ├── progressService.ts
│   ├── deckService.ts
│   └── bookmarkService.ts
└── utils/               # 유틸리티 함수
```

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

사용자 인증 정보

```typescript
{
  _id: ObjectId,
  email: string,              // 이메일 (unique)
  name: string,               // 사용자 이름
  type: "google",             // OAuth 제공자
  learningCheckpoint: {       // 레거시 체크포인트 (하위 호환)
    level: string,
    step: { start: number, end: number }
  },
  createdAt: Date,
  updatedAt: Date
}
```

**인덱스**:

- `email: 1` (unique)

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
  step: number,               // 레벨 내 단계 (1-10)
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
    start: number,            // 1-10
    end: number               // 1-10
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
  is_bookmarked: boolean,     // 북마크 여부 (세션 간 공유)
  last_studied_at?: Date,     // 마지막 학습 시간
  created_at: Date,
  updated_at: Date
}
```

**인덱스**:

- `{ user_id: 1, word_id: 1, progress_type: 1 }` (unique, 복합)
- `{ user_id: 1, is_bookmarked: 1 }` (복합)
- `{ user_id: 1, is_completed: 1, progress_type: 1 }` (복합)

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

## 슬라이딩 윈도우 시스템

### 개념

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

**N5 레벨 (steps 1-10)**:

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

#### 🔄 진행 중

2. **Redux Store 리팩토링**:
   - 레거시 deck store를 UserCheckpoint 기반으로 전환
   - Main/Sub 세션 분리 관리

#### ⏳ 예정

3. **컴포넌트 마이그레이션**:
   - FlashCardPage
   - LevelSelectionPage
   - Checkpoint 관리 컴포넌트

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

### Redux Store 구조 (예정)

```typescript
interface CheckpointState {
  main: {
    session: UserCheckpoint | null;
    deck: CurrentDeck | null;
    loading: boolean;
    error: string | null;
  };
  sub: {
    session: UserCheckpoint | null;
    deck: CurrentDeck | null;
    loading: boolean;
    error: string | null;
  };
  activeType: 'main' | 'sub';
}
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
