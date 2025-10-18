# 프론트엔드 API 마이그레이션 가이드

## 📊 현재 상태

### ✅ 완료된 작업

#### 1. API 서비스 레이어 생성 (완료)

새로운 백엔드 API 엔드포인트를 위한 서비스 레이어를 생성했습니다:

**생성된 파일:**
- `frontend/src/services/apiClient.ts` - 공통 API 클라이언트
- `frontend/src/services/types.ts` - TypeScript 타입 정의
- `frontend/src/services/progressService.ts` - UserProgress API
- `frontend/src/services/deckService.ts` - Deck API
- `frontend/src/services/bookmarkService.ts` - Bookmark API
- `frontend/src/services/index.ts` - 통합 export

### ⏳ 진행 중인 작업

#### 2. Redux Store 리팩토링

**현재 구조 (레거시):**
```typescript
// store/modules/deck.ts
interface deckState {
  deck: Array<WordType> | null;
  loading: boolean;
  error: string | null;
}
```

**새로운 구조 (필요):**
```typescript
interface ProgressState {
  main: {
    session: UserProgress | null;
    deck: CurrentDeck | null;
    loading: boolean;
    error: string | null;
  };
  sub: {
    session: UserProgress | null;
    deck: CurrentDeck | null;
    loading: boolean;
    error: string | null;
  };
  activeType: 'main' | 'sub';
}
```

### 🔜 예정된 작업

3. FlashCardPage 마이그레이션
4. 체크포인트 복원 로직
5. 자동 저장 로직

## 🎯 마이그레이션 전략

### Phase 1: API 서비스 레이어 (✅ 완료)

새로운 백엔드 API를 위한 TypeScript 서비스 레이어를 생성했습니다.

**주요 기능:**
- ✅ 자동 인증 헤더 추가
- ✅ 공통 에러 처리
- ✅ 타입 안전성
- ✅ 한글 주석 및 사용 예시

### Phase 2: Redux Store 리팩토링 (🔄 진행 중)

레거시 deck store를 UserProgress 기반으로 재설계합니다.

**변경 사항:**
- ❌ 레거시: `/api/words/level/{level}` - 전체 단어 조회
- ✅ 신규: `/api/deck/{progressType}/current` - 세션 기반 덱 조회

### Phase 3: 컴포넌트 마이그레이션

FlashCardPage와 관련 컴포넌트를 신규 API로 마이그레이션합니다.

## 📚 API 사용 예시

### 1. 세션 생성

```typescript
import { progressService } from 'services';

// Main 세션 생성
const response = await progressService.createSession({
  type: 'main',
  level: 'N5',
  steps: { start: 1, end: 3 }
});

if (response.success) {
  const { session, sessionStats, deckSize } = response.data;
  console.log(`세션 생성 완료! 덱 크기: ${deckSize}개`);
}
```

### 2. 현재 덱 조회

```typescript
import { deckService } from 'services';

// 현재 Main 세션의 덱 조회
const response = await deckService.getCurrentDeck('main');

if (response.success) {
  const { words, currentIndex, sessionStats } = response.data;
  const currentWord = words[currentIndex];

  console.log(`현재 단어: ${currentWord.entry}`);
  console.log(`진행률: ${sessionStats.progressPercentage}%`);
}
```

### 3. 단어 완료 처리

```typescript
import { deckService } from 'services';

// 정답 처리
const response = await deckService.completeWord('main', {
  wordId: currentWord._id,
  isCorrect: true,
  timeSpent: 15,
  difficulty: 'easy'
});

if (response.success) {
  const { currentIndex, isSessionCompleted } = response.data;

  if (isSessionCompleted) {
    console.log('덱 완료! 다음 윈도우로 이동 가능');
  }
}
```

### 4. 북마크 관리

```typescript
import { bookmarkService } from 'services';

// 북마크 추가
await bookmarkService.addBookmark(wordId, 'main', '어려운 단어');

// 북마크 목록 조회
const response = await bookmarkService.getBookmarks({
  level: 'N5',
  sortBy: 'recent',
  limit: 50
});
```

## 🔄 레거시 vs 신규 API 비교

### 덱 로딩

**레거시:**
```typescript
// ❌ 레벨의 모든 단어 조회 (비효율적)
const response = await axios.get(`/api/words/level/${level}`);
const allWords = response.data; // 400+ words
// 클라이언트에서 필터링 및 셔플 필요
```

**신규:**
```typescript
// ✅ 세션 기반 덱 조회 (효율적)
const response = await deckService.getCurrentDeck('main');
const deck = response.data; // 40-120 words (3-step window)
// 서버에서 이미 필터링, 셔플, 북마크 우선순위 처리됨
```

### 진행 상황 저장

**레거시:**
```typescript
// ❌ 진행 상황 관리 없음
// 브라우저 새로고침 시 학습 내용 손실
```

**신규:**
```typescript
// ✅ 자동 체크포인트 저장
// - 개발: 매 단어마다
// - 운영: 5단어마다
// 브라우저 재접속 시 자동 복원
```

### 북마크

**레거시:**
```typescript
// ❌ 북마크 기능 없음
```

**신규:**
```typescript
// ✅ 북마크 기능 완비
await bookmarkService.toggleBookmark(wordId);
// 북마크된 단어는 덱의 앞쪽 40%에 우선 배치
```

## 🚀 다음 단계

### 1. Redux Store 설계 (진행 중)

**목표:**
- Main/Sub 세션 분리 관리
- UserProgress 상태 관리
- 현재 덱 캐싱
- 로딩/에러 상태 관리

**파일:**
- `store/modules/progress.ts` - NEW
- `store/modules/deck.ts` - REFACTOR

### 2. FlashCardPage 마이그레이션

**변경 사항:**
- `/api/words/level/{level}` → `/api/deck/main/current`
- 로컬 캐시 제거 (서버 세션으로 대체)
- 체크포인트 복원 로직 추가

### 3. 학습 플로우 구현

**새로운 플로우:**
```
1. 앱 진입
2. 세션 존재 확인 (자동 체크포인트 복원)
3. 없으면 세션 생성 (level, steps 선택)
4. 덱 로딩
5. 학습 시작
6. 매 단어 완료마다 자동 저장 (개발 모드)
7. 덱 완료 시 다음 윈도우 전환
```

## 📝 주요 변경 사항 체크리스트

### API 서비스
- [x] apiClient 생성
- [x] TypeScript 타입 정의
- [x] progressService 구현
- [x] deckService 구현
- [x] bookmarkService 구현
- [x] 통합 export

### Redux Store
- [ ] progressStore 생성
- [ ] deckStore 리팩토링
- [ ] Actions 정의
- [ ] Thunks/Sagas 구현
- [ ] Selectors 작성

### 컴포넌트
- [ ] FlashCardPage 마이그레이션
- [ ] LevelSelectionPage 업데이트
- [ ] UserProgress 컴포넌트 연동
- [ ] Bookmark 기능 추가

### 기능
- [ ] 체크포인트 자동 복원
- [ ] 진행 상황 자동 저장
- [ ] 북마크 토글
- [ ] 슬라이딩 윈도우 전환
- [ ] Main/Sub 세션 전환

## 🔗 관련 문서

- `SLIDING_WINDOW_IMPLEMENTATION.md` - 슬라이딩 윈도우 구현 상세
- `CHECKPOINT_CONFIGURATION_GUIDE.md` - 체크포인트 설정 가이드
- `backend/src/routes/progressRoutes.ts` - Progress API 라우트
- `backend/src/routes/deckRoutes.ts` - Deck API 라우트

---

**작성일:** 2025-01-18
**현재 진행률:** 40% (2/5 단계 완료)
**예상 완료일:** 2-3일 소요 예정
