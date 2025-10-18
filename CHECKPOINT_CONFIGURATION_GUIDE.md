# 체크포인트 설정 가이드

## 📌 개요

체크포인트 시스템의 자동 저장 빈도와 동작을 환경에 맞게 설정할 수 있습니다.

## 🔧 환경별 기본 설정

### Development (개발 환경)
```bash
CHECKPOINT_SAVE_INTERVAL=1        # 매 단어마다 저장
CHECKPOINT_VERBOSE_LOGGING=true   # 상세 로깅 활성화
```

**특징:**
- ✅ 모든 학습 진행 상황 실시간 저장
- ✅ 디버깅 용이 (모든 저장/복원 작업 로그 출력)
- ⚠️ DB 쓰기 작업 증가 (개발 환경이므로 무관)

### Production (운영 환경)
```bash
CHECKPOINT_SAVE_INTERVAL=5         # 5단어마다 저장
CHECKPOINT_VERBOSE_LOGGING=false   # 상세 로깅 비활성화
```

**특징:**
- ✅ DB 부하 최소화
- ✅ 필수 로그만 출력 (오류 등)
- ✅ 최대 4단어 손실 가능 (수용 가능한 수준)

## 📁 설정 파일 위치

### 1. 환경 변수 (.env)
```bash
# backend/.env
CHECKPOINT_SAVE_INTERVAL=1
CHECKPOINT_MAX_PER_USER=10
CHECKPOINT_EXPIRATION_DAYS=30
CHECKPOINT_VERBOSE_LOGGING=true
```

### 2. 설정 코드
```typescript
// backend/src/config/checkpoint.ts
export const CheckpointConfig = {
  AUTO_SAVE_INTERVAL: 1,              // 자동 저장 간격
  MAX_CHECKPOINTS_PER_USER: 10,       // 사용자당 최대 보관 개수
  CHECKPOINT_EXPIRATION_DAYS: 30,     // 만료 기간 (일)
  VERBOSE_LOGGING: true,              // 상세 로깅 활성화
};
```

## 🎯 설정 항목 상세

### 1. CHECKPOINT_SAVE_INTERVAL (자동 저장 간격)

**의미:** 몇 단어마다 체크포인트를 저장할지 결정

**예시:**
```typescript
// interval = 1 (Development)
단어 1: 저장 ✅
단어 2: 저장 ✅
단어 3: 저장 ✅
단어 4: 저장 ✅
단어 5: 저장 ✅

// interval = 5 (Production)
단어 1: 건너뜀 ⏭️
단어 2: 건너뜀 ⏭️
단어 3: 건너뜀 ⏭️
단어 4: 건너뜀 ⏭️
단어 5: 저장 ✅
단어 6: 건너뜀 ⏭️
...
단어 10: 저장 ✅
```

**권장값:**
- **개발:** `1` - 모든 동작 추적
- **운영:** `5` - 성능과 안정성 균형

### 2. CHECKPOINT_MAX_PER_USER (최대 보관 개수)

**의미:** 사용자당 보관할 체크포인트 개수 (FIFO 방식)

**동작:**
```
사용자 A의 체크포인트:
1. 2025-01-15 10:00 (가장 오래됨)
2. 2025-01-15 10:05
3. 2025-01-15 10:10
...
10. 2025-01-15 11:00

11번째 저장 시:
→ 1번 자동 삭제
→ 11번이 10번 슬롯에 저장
```

**권장값:** `10` (충분한 복원 지점 확보)

### 3. CHECKPOINT_EXPIRATION_DAYS (만료 기간)

**의미:** 체크포인트를 보관하는 기간 (일)

**동작:**
- MongoDB TTL 인덱스로 자동 삭제
- 만료 시간 = 생성 시간 + EXPIRATION_DAYS

**권장값:**
- **일반:** `30일` - 한 달 이내 복원 가능
- **긴급:** `7일` - DB 용량 절약 필요 시

### 4. CHECKPOINT_VERBOSE_LOGGING (상세 로깅)

**의미:** 체크포인트 작업을 콘솔에 출력할지 결정

**출력 예시:**
```bash
# VERBOSE_LOGGING = true
[Checkpoint] Auto-saving checkpoint for user 507f1f77, type main, index 3
[Checkpoint] Checkpoint saved successfully for user 507f1f77, type main, index 3/50
[Checkpoint] Cleaned up 2 old checkpoints for user 507f1f77, type main

# VERBOSE_LOGGING = false
(오류만 출력)
[Checkpoint Error] Checkpoint auto-save failed: Connection timeout
```

**권장값:**
- **개발:** `true` - 디버깅 용이
- **운영:** `false` - 로그 부담 감소

## 📊 저장 시점

### 자동 저장 트리거

1. **단어 완료 시 (간격 기준)**
   ```typescript
   // deckController.ts:334
   if (CheckpointConfig.shouldSaveCheckpoint(progress.current_index, progress.isCompleted())) {
     UserProgress.saveCheckpoint(userId, progressType);
   }
   ```

2. **덱 완료 시 (항상)**
   ```typescript
   // deckController.ts:600
   await UserProgress.saveCheckpoint(userId, progressType);
   ```

3. **윈도우 전환 후 (항상)**
   ```typescript
   // deckController.ts:614
   await UserProgress.saveCheckpoint(userId, progressType);
   ```

4. **벌크 작업 후 (항상)**
   ```typescript
   // deckController.ts:461
   UserProgress.saveCheckpoint(userId, progressType);
   ```

### 저장하지 않는 경우

- 간격 조건 미충족 시
- 세션이 이미 완료된 경우
- 사용자 인증 정보 없을 때

## 🔄 미들웨어 상태

### 현재 사용 중인 방식
```typescript
// deckController에서 직접 호출 (현재)
UserProgress.saveCheckpoint(userId, progressType);
```

### 미들웨어 방식 (향후 사용 가능)
```typescript
// routes에서 미들웨어로 사용 가능
import { autoSaveCheckpoint } from '../middleware/checkpointMiddleware';

router.post('/complete-word',
  authenticate,
  autoSaveCheckpoint,  // 응답 후 자동 저장
  completeWord
);
```

**참고:** 현재는 미들웨어를 사용하지 않고 controller에서 직접 저장합니다.
이는 더 명시적이고 제어하기 쉽기 때문입니다.

## 📝 로그 예시

### Development 모드 (VERBOSE_LOGGING=true)

```bash
[Checkpoint] Auto-saving checkpoint for user 507f1f77bcf86cd799439011, type main, index 1
[Checkpoint] Checkpoint saved successfully for user 507f1f77bcf86cd799439011, type main, index 1/50

[Checkpoint] Auto-saving checkpoint for user 507f1f77bcf86cd799439011, type main, index 2
[Checkpoint] Checkpoint saved successfully for user 507f1f77bcf86cd799439011, type main, index 2/50

[Checkpoint] Cleaned up 1 old checkpoints for user 507f1f77bcf86cd799439011, type main
```

### Production 모드 (VERBOSE_LOGGING=false)

```bash
(정상 작동 시 로그 없음)

# 오류 발생 시만 출력
[Checkpoint Error] Checkpoint auto-save failed: Error: Connection timeout
```

## 🛠️ 설정 변경 방법

### 1. 개발 중 테스트 (임시 변경)

```bash
# backend/.env
CHECKPOINT_SAVE_INTERVAL=3  # 3단어마다 저장으로 변경
CHECKPOINT_VERBOSE_LOGGING=true
```

서버 재시작:
```bash
cd backend
yarn dev
```

### 2. 운영 배포 (영구 변경)

```bash
# 운영 서버의 .env
CHECKPOINT_SAVE_INTERVAL=10  # 10단어마다 저장
CHECKPOINT_VERBOSE_LOGGING=false

# PM2 사용 시
pm2 restart kan-ji-backend
```

### 3. 코드 레벨 변경 (하드코딩)

```typescript
// backend/src/config/checkpoint.ts
export const CheckpointConfig = {
  AUTO_SAVE_INTERVAL: 1,  // ← 여기 수정
  // ...
};
```

**주의:** 환경 변수가 코드보다 우선순위가 높습니다.

## 🎯 시나리오별 권장 설정

### 시나리오 1: 로컬 개발 (현재)
```bash
CHECKPOINT_SAVE_INTERVAL=1
CHECKPOINT_VERBOSE_LOGGING=true
```
→ 모든 동작 추적, 디버깅 용이

### 시나리오 2: 스테이징 서버
```bash
CHECKPOINT_SAVE_INTERVAL=3
CHECKPOINT_VERBOSE_LOGGING=true
```
→ 운영과 유사한 환경, 로깅은 유지

### 시나리오 3: 운영 서버
```bash
CHECKPOINT_SAVE_INTERVAL=5
CHECKPOINT_VERBOSE_LOGGING=false
```
→ 성능 최적화, 필수 로그만

### 시나리오 4: 고부하 서버
```bash
CHECKPOINT_SAVE_INTERVAL=10
CHECKPOINT_MAX_PER_USER=5
CHECKPOINT_EXPIRATION_DAYS=7
```
→ DB 부하 최소화, 저장 공간 절약

## 📈 성능 영향 분석

### DB 쓰기 작업 비교

**시나리오:** 100단어 학습

| 설정 | 저장 횟수 | DB Write | 상대적 부하 |
|------|----------|----------|------------|
| interval=1 | 100회 | 100 writes | 100% |
| interval=3 | 34회 | 34 writes | 34% |
| interval=5 | 20회 | 20 writes | 20% |
| interval=10 | 10회 | 10 writes | 10% |

**결론:**
- interval=5는 80%의 DB 쓰기 감소
- 최대 4단어 손실 위험 (수용 가능)

## 🔍 트러블슈팅

### 문제 1: 체크포인트가 저장되지 않음

**확인 사항:**
```bash
# 1. 환경 변수 확인
echo $CHECKPOINT_SAVE_INTERVAL

# 2. 로그 확인
tail -f logs/app.log | grep Checkpoint

# 3. MongoDB 연결 확인
mongo --eval "db.learning_checkpoints.count()"
```

### 문제 2: 로그가 너무 많음

**해결:**
```bash
# .env
CHECKPOINT_VERBOSE_LOGGING=false
```

### 문제 3: DB 용량 증가

**해결:**
```bash
# 체크포인트 개수 줄이기
CHECKPOINT_MAX_PER_USER=5
CHECKPOINT_EXPIRATION_DAYS=14

# 수동 정리
db.learning_checkpoints.deleteMany({ expires_at: { $lt: new Date() } })
```

## 📚 관련 파일

- `backend/src/config/checkpoint.ts` - 설정 정의
- `backend/src/middleware/checkpointMiddleware.ts` - 미들웨어 (미사용)
- `backend/src/controllers/deckController.ts` - 실제 저장 로직
- `backend/.env.example` - 설정 예시
- `CHECKPOINT_CONFIGURATION_GUIDE.md` - 이 문서

---

**작성일:** 2025-01-18
**버전:** 1.0.0
