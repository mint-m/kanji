# 체크포인트 API 문서

## 체크포인트 업데이트 엔드포인트

**엔드포인트**: `PATCH /api/users/:userId/checkpoint`

**인증**: 필수 (JWT)

**설명**: 사용자의 학습 체크포인트를 업데이트합니다. 새로운 UserProgress 기반 시스템과 레거시 체크포인트 포맷을 모두 지원하여 하위 호환성을 유지합니다.

---

### 요청 파라미터

#### 경로 파라미터

- `userId` (string, 필수): 사용자의 MongoDB ObjectId

#### 본문 파라미터

**옵션 1: 새로운 UserProgress 기반 시스템 (권장)**

```json
{
  "progressType": "main", // "main" 또는 "sub" (기본값: "main")
  "level": "N5", // "N5", "N4", "N3", "N2", "N1" 중 하나
  "steps": {
    "start": 1, // 1-10 범위
    "end": 3 // 1-10 범위
  },
  "currentIndex": 0 // 선택사항, 현재 덱에서의 단어 인덱스
}
```

---

### 응답 형식

#### 성공 응답 (새 시스템)

**상태 코드**: 200 OK

```json
{
  "success": true,
  "message": "Checkpoint updated successfully",
  "data": {
    "userProgress": {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
      "user_id": "64f5a1b2c3d4e5f6g7h8i9j1",
      "progress_type": "main",
      "current_level": "N5",
      "steps": {
        "start": 1,
        "end": 3
      },
      "shuffled_order": ["word_id_1", "word_id_2", ...],
      "current_index": 5,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T11:30:00.000Z"
    },
    "user": {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j1",
      "email": "user@example.com",
      "name": "사용자 이름",
      "learningCheckpoint": {
        "level": "N5",
        "step": {
          "start": 1,
          "end": 3
        }
      }
    }
  }
}
```

#### 성공 응답 (레거시 시스템)

**상태 코드**: 200 OK

```json
{
  "success": true,
  "message": "Legacy checkpoint updated successfully",
  "data": {
    "user": {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j1",
      "email": "user@example.com",
      "name": "사용자 이름",
      "type": "google",
      "learningCheckpoint": {
        "level": "N5",
        "step": {
          "min": 1,
          "max": 3
        }
      }
    }
  }
}
```

---

### 에러 응답

#### 400 Bad Request - 필수 데이터 누락

```json
{
  "success": false,
  "message": "Either (level + steps) or checkpoint data is required"
}
```

#### 400 Bad Request - 잘못된 진행 타입

```json
{
  "success": false,
  "message": "Invalid progress type. Must be 'main' or 'sub'"
}
```

#### 400 Bad Request - 잘못된 레벨

```json
{
  "success": false,
  "message": "Invalid level. Must be N5, N4, N3, N2, or N1"
}
```

#### 403 Forbidden - 권한 없음

```json
{
  "success": false,
  "message": "You can only update your own checkpoint"
}
```

#### 404 Not Found - 사용자 없음

```json
{
  "success": false,
  "message": "User not found"
}
```

#### 500 Internal Server Error - 서버 오류

```json
{
  "success": false,
  "message": "Failed to update checkpoint"
}
```

---

### 동작 상세

#### 새 시스템 (level + steps 사용)

1. **UserProgress 생성 또는 업데이트**:

   - 해당 사용자/progressType 조합에 대한 UserProgress가 없으면 새 세션 생성
   - 슬라이딩 윈도우 (level + steps) 기반으로 새 덱 생성
   - 완료된 단어를 필터링하고 선택적으로 북마크된 단어 우선순위 적용
   - 세션 복구를 위한 체크포인트 데이터 저장

2. **사용자의 레거시 체크포인트 업데이트**:

   - User 모델의 `learningCheckpoint` 필드를 업데이트하여 하위 호환성 유지

3. **자동 체크포인트 생성**:
   - Checkpoint 컬렉션에 세션 복구용 체크포인트 생성
   - 체크포인트에는 윈도우 메타데이터, 단어 순서, 진행 위치 포함

#### 레거시 시스템 (checkpoint 사용)

1. **직접 업데이트**:
   - User 모델의 `learningCheckpoint` 필드만 업데이트
   - UserProgress나 Checkpoint 레코드를 생성하지 않음
   - 구 버전 클라이언트와의 호환성 유지

---

### 사용 예시

#### 예시 1: N5 Steps 1-3에서 새 Main 세션 시작

**요청**:

```bash
curl -X PATCH http://localhost:8000/api/users/64f5a1b2c3d4e5f6g7h8i9j1/checkpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "progressType": "main",
    "level": "N5",
    "steps": {
      "start": 1,
      "end": 3
    }
  }'
```

**응답**: N5 steps 1-3에서 생성된 덱으로 새 UserProgress 세션 생성

---

#### 예시 2: 기존 세션의 현재 인덱스 업데이트

**요청**:

```bash
curl -X PATCH http://localhost:8000/api/users/64f5a1b2c3d4e5f6g7h8i9j1/checkpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "progressType": "main",
    "level": "N5",
    "steps": {
      "start": 1,
      "end": 3
    },
    "currentIndex": 15
  }'
```

**응답**: 기존 UserProgress를 업데이트하고 체크포인트 저장

---

#### 예시 3: Sub 세션 시작 (북마크 중심)

**요청**:

```bash
curl -X PATCH http://localhost:8000/api/users/64f5a1b2c3d4e5f6g7h8i9j1/checkpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "progressType": "sub",
    "level": "N4",
    "steps": {
      "start": 5,
      "end": 7
    }
  }'
```

**응답**: 북마크 복습을 위한 별도의 sub-session UserProgress 생성

---

#### 예시 4: 레거시 포맷 업데이트

**요청**:

```bash
curl -X PATCH http://localhost:8000/api/users/64f5a1b2c3d4e5f6g7h8i9j1/checkpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoint": {
      "level": "N3",
      "step": {
        "min": 4,
        "max": 6
      }
    }
  }'
```

**응답**: User.learningCheckpoint만 업데이트 (레거시 모드)

---

### 마이그레이션 노트

- **이중 시스템 지원**: 엔드포인트는 새로운 (UserProgress 기반) 시스템과 레거시 (User.learningCheckpoint) 시스템을 모두 지원
- **자동 마이그레이션**: 새 포맷 사용 시, 하위 호환성을 위해 레거시 필드가 자동으로 업데이트됨
- **세션 독립성**: Main과 Sub 세션은 완전히 독립적 (UserProgress에서 별도로 추적)
- **체크포인트 자동 저장**: 모든 업데이트는 세션 복구를 위한 체크포인트를 생성

---

### 관련 엔드포인트

- `GET /api/progress/:progressType` - 현재 UserProgress 조회
- `GET /api/progress/:progressType/deck` - 현재 덱 조회
- `POST /api/progress/:progressType/checkpoint/restore` - 체크포인트에서 복원
- `GET /api/users/:userId` - 사용자 프로필 조회 (레거시 체크포인트 포함)

---

### 보안 사항

- JWT 인증 필수
- 사용자는 자신의 체크포인트만 업데이트 가능 (사용자 ID 검증으로 강제)
- 진행 타입, 레벨, 스텝 범위가 검증됨
- 트랜잭션 업데이트를 통해 체크포인트 무결성 유지

---

## 주요 기능

### 1. 이중 시스템 지원

엔드포인트는 두 가지 방식으로 작동합니다:

**새 시스템 (권장)**:

- UserProgress 테이블에 세션 상태 저장
- Checkpoint 테이블에 복구 포인트 저장
- Main/Sub 세션 독립 관리
- 슬라이딩 윈도우 덱 시스템 완전 지원

**레거시 시스템**:

- User 테이블의 learningCheckpoint 필드만 사용
- 구 버전 클라이언트와의 호환성 유지
- 간단한 체크포인트 저장만 필요한 경우 사용

### 2. 자동 덱 생성

새 시스템 사용 시:

- 레벨과 스텝 범위에 맞는 단어 자동 검색
- 완료된 단어 자동 필터링
- 북마크된 단어 우선순위 적용 (옵션)
- 피셔-예이츠 셔플로 랜덤화

### 3. 체크포인트 관리

- 세션 진행 상황 자동 저장
- 비정상 종료 시 복구 가능
- 윈도우 히스토리 추적
- 메타데이터 및 버전 관리

### 4. 세션 독립성

- Main 세션: 체계적 학습용
- Sub 세션: 북마크 복습용
- 각 세션은 독립적인 진행 상황 유지
- 세션 간 전환 가능

---

## 기술적 세부사항

### 데이터베이스 구조

**UserProgress 컬렉션**:

```javascript
{
  user_id: ObjectId,           // 사용자 ID
  progress_type: "main" | "sub", // 세션 타입
  current_level: "N5" | "N4" | ..., // 현재 레벨
  steps: {
    start: Number,             // 시작 스텝 (1-10)
    end: Number                // 종료 스텝 (1-10)
  },
  shuffled_order: [ObjectId],  // 셔플된 단어 ID 배열
  current_index: Number,       // 현재 학습 중인 단어 인덱스
  created_at: Date,
  updated_at: Date
}
```

**Checkpoint 컬렉션**:

```javascript
{
  user_id: ObjectId,
  progress_type: "main" | "sub",
  level: String,
  current_window: {
    level: String,
    steps: { start: Number, end: Number },
    word_ids: [ObjectId],
    window_index: Number,
    is_circular: Boolean,
    total_windows: Number
  },
  current_index: Number,
  window_history: [{ start: Number, end: Number }],
  completed_windows: Number,
  shuffled_order: [ObjectId],
  session_stats: {
    words_completed: Number,
    total_words: Number,
    session_start_time: Date,
    last_activity_time: Date
  },
  version: String,
  is_active: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### 슬라이딩 윈도우 시스템

3단계 슬라이딩 윈도우:

- 1-3 → 2-4 → 3-5 → ... → 8-10
- 순환 복습: 9-1, 10-2 (레벨 경계 넘어감)
- 각 윈도우는 독립적인 덱 생성

### 성능 최적화

- 복합 인덱스: `{ user_id: 1, progress_type: 1 }`
- 완료된 단어 필터링 최적화
- 체크포인트 자동 정리 (최대 10개 유지)
- 비동기 처리로 응답 속도 향상
