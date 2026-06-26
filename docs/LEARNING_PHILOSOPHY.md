# 학습 철학 (Learning Philosophy)

## 핵심 철학: 완전 습득 기반 진행

### 기본 원칙

단어 학습은 **단순 노출이 아닌 완전 습득**을 목표로 한다.  
현재 윈도우의 모든 단어를 "알았음"으로 체크해야만 다음 윈도우로 진행할 수 있다.

---

## 학습 단위 정의

### 윈도우 (Window)

- 3개의 스텝으로 구성된 학습 단위
- 예: `{1,2,3}`, `{2,3,4}`, ..., `{10,1,2}` (순환)
- 각 스텝에는 여러 단어가 배정되어 있음

### 덱 (Deck)

- 현재 윈도우에 속한 모든 단어의 집합
- 매 패스 시작 시 셔플되어 제공됨

### 패스 (Pass)

- 덱의 단어를 처음부터 끝까지 한 번 훑는 것
- 패스 완료 후 "모름" 단어가 있으면 → 새로운 패스 시작
- 패스 완료 후 모든 단어가 "알았음" → 윈도우 완료

---

## 학습 흐름

### 한 세션의 흐름

```
[윈도우 시작]
    ↓
[덱 생성 & 셔플]
    ↓
[패스 시작: 단어 하나씩 제시]
    ↓
    ├─ [알았음] → is_window_completed = true
    └─ [모름]   → is_window_completed = false (유지)
    ↓
[패스 완료 판단: 덱의 모든 단어를 한 번 제시했음]
    ↓
    ├─ "모름" 단어 있음 → 모름 단어만 셔플 → 새 패스 시작
    └─ 모든 단어 "알았음" → [윈도우 완료]
                                ↓
                          [다음 윈도우 진행]
                          기존 윈도우 단어 is_window_completed = false 리셋
```

### 윈도우 진행 예시

| 윈도우 | 스텝 구성  |
| ------ | ---------- |
| 1      | {1, 2, 3}  |
| 2      | {2, 3, 4}  |
| 3      | {3, 4, 5}  |
| ...    | ...        |
| 10     | {10, 1, 2} |

윈도우 10 완료 → 해당 레벨 학습 완료

---

## 데이터 보존 정책

### 리셋되는 데이터 (윈도우 진행 시)

- `is_window_completed`: `false`로 초기화

### 유지되는 데이터 (영구 보존)

- `try_count`: 누적 시도 횟수
- `correct_count`: 누적 정답 횟수
- `study_history`: 학습 이력
- `is_bookmarked`: 북마크 여부

---

## 완료 조건 정의

| 완료 단위   | 조건                                               |
| ----------- | -------------------------------------------------- |
| 패스 완료   | 현재 덱의 모든 단어를 한 번 제시함                 |
| 윈도우 완료 | 덱의 모든 단어 `is_window_completed = true`        |
| 레벨 완료   | 해당 레벨의 모든 윈도우 완료 (윈도우 10 완료 시점) |

---

## 구현 현황 (2026-06-23 기준)

### ✅ Backend 완료

1. **`WordProgress.is_window_completed`**: `is_completed` 대체. 윈도우 이동 시 자동 리셋
2. **`UserCheckpoint.isCompleted()`**: 패스 순회 완료 여부 (인덱스 기반, 그대로 유지)
3. **`UserCheckpoint.isWindowCompleted(userId, progressType)`**: 모든 단어 `is_window_completed = true` 확인
4. **`UserCheckpoint.reshuffleUnknownWords(userId, progressType)`**: 미지 단어 추출 후 재셔플, `current_index = 0` 리셋
5. **`UserCheckpoint.generateNextSlidingWindow(userId, progressType)`**: 다음 윈도우 생성 + 이전 단어 `is_window_completed` 자동 리셋
6. **`deckController.completeWord()`**: 패스 완료 감지 → 자동 재셔플 또는 윈도우 완료 플래그 반환
7. **`deckController.completeDeck()`**: `isWindowCompleted` 기반 완료 조건으로 변경
8. **중복 카운팅 버그 수정**: `markCompleted()`/`markIncomplete()`가 `try_count`를 중복 증가하던 버그 제거

### ✅ Frontend 완료 (2026-06-23)

- **타입 정의**: `CompleteWordResponse`에 `passComplete`, `windowComplete`, `nextPassSize` 추가
- **`FlashCardContainer`**: `completeWord` 응답 처리 — 패스 완료/윈도우 완료 콜백 분기
- **`FlashCardPage`**: 패스 완료 시 덱 재fetch + 리마운트, 윈도우 완료 시 전용 UI 표시
