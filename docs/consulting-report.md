# KAN-JI — 잔여 이슈 & 작업 목록

> 완료 이력은 [_archive/consulting-completed.md](_archive/consulting-completed.md) 참고

---

## 기능 구현 현황

| 기능 | 상태 | 완성도 |
|---|---|---|
| 슬라이딩 윈도우 학습 시스템 (완전 습득형) | 완료 | 95% |
| Google / Kakao OAuth 인증 + 계정 연동 | 완료 | 90% |
| 북마크 시스템 | 완료 | 80% |
| 체크포인트 저장/복원 | 완료 | 85% |
| Main / Sub 세션 전환 | 완료 | 80% |
| 단어 진도 추적 | 완료 | 80% |
| 테스트 코드 | 부분 완료 | 45% |
| 학습 알림 시스템 | 미구현 | 0% |

---

## 잔여 이슈

### 🟡 High

**테스트 커버리지 부족**
- 백엔드: `deckController`, `progressController`, `bookmarkController`
- 프론트엔드: `FlashCardContainer`, `apiClient` 인터셉터
- E2E: 로그인 → 레벨 선택 → 학습 → 윈도우 전환

**진도 업데이트 Race Condition**
`FlashCardContainer`에서 단어 완료 요청이 `await` 없이 발사됨. 빠른 카드 넘기기 시 진도 유실 가능. 요청 큐 또는 순차 처리 필요.

**CORS 전체 허용**
`backend/app.ts`에서 `origin: true`. 프로덕션 배포 전 도메인 화이트리스트 필요.

### 🟠 Medium

**React 에러 바운더리 누락**
페이지별 `ErrorBoundary` 없음 → 하위 컴포넌트 예외 시 전체 앱 흰 화면 크래시.

**서버 측 입력값 검증 부재**
`WordController`의 `sortBy` 등 사용자 입력이 검증 없이 쿼리에 사용됨.

**로깅 시스템 미구축**
`console.error` / `console.log`만 사용. Winston 또는 Pino 도입 권장.

### 🟢 Low

- `SlidingWindowService.getNextWindow` 매 호출마다 DB에서 `maxStep` 조회 — 캐싱 검토
- `/health` 엔드포인트 없음
- Swagger/OpenAPI 문서 없음

---

## 작업 우선순위

| # | 작업 | 심각도 | 예상 공수 |
|---|---|---|---|
| 1 | E2E 테스트 (Playwright/Cypress) | 🟡 | 3일 |
| 2 | 나머지 컨트롤러 단위 테스트 | 🟡 | 2일 |
| 3 | Race Condition 해결 (요청 큐) | 🟡 | 1일 |
| 4 | CORS 화이트리스트 설정 | 🟡 | 0.5일 |
| 5 | React ErrorBoundary 전 페이지 적용 | 🟠 | 0.5일 |
| 6 | 서버 측 입력값 검증 | 🟠 | 1일 |
| 7 | 로깅 시스템 도입 | 🟠 | 1일 |
| 8 | `/health` 엔드포인트 | 🟢 | 0.5일 |
| 9 | CI/CD 파이프라인 (GitHub Actions) | 🟢 | 1일 |
