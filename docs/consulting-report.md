# KAN-JI 프로젝트 — 전문가 코드 점검 및 컨설팅 보고서

| 항목 | 내용 |
|---|---|
| 작성일 | 2026년 4월 4일 |
| 문서 유형 | 외부 기술 컨설팅 보고서 |
| 검토 대상 | JLPT 일본어 단어 학습 애플리케이션 |

---

## 전체 완성도 평가: **62 / 100**

> 출시 전 핵심 작업 필요

---

## 1. 프로젝트 개요

KAN-JI (간지)는 JLPT (일본어능력시험) N1~N5 레벨 어휘를 학습하기 위한 풀스택 웹 애플리케이션입니다. 슬라이딩 윈도우(Sliding Window) 방식의 반복 학습 시스템을 핵심으로 하며, 북마크 기반의 Sub 세션과 체크포인트 저장 기능을 통해 학습 연속성을 제공합니다.

### 기술 스택

| 구분 | 기술 | 버전/비고 |
|---|---|---|
| 프론트엔드 | React + TypeScript | 18.x |
| 상태 관리 | Redux Toolkit | 최소 사용 (user, kanji) |
| 스타일링 | Styled Components | CSS-in-JS |
| 라우팅 | React Router | v6 |
| 백엔드 | Node.js + Express + TypeScript | - |
| 데이터베이스 | MongoDB + Mongoose | Atlas 또는 Local |
| 인증 | Google OAuth 2.0 + JWT | - |
| 빌드 | Yarn Workspaces (Monorepo) | - |

### 핵심 기능 구현 현황

| 기능 | 구현 상태 | 완성도 |
|---|---|---|
| 슬라이딩 윈도우 학습 시스템 | 구현 완료 | 90% |
| Google OAuth 인증 | 구현 완료 | 85% |
| 북마크 시스템 | 구현 완료 | 80% |
| 체크포인트 저장/복원 | 구현 완료 | 85% |
| Main / Sub 세션 전환 | 구현 완료 | 80% |
| 단어 진도 추적 | 구현 완료 | 75% |
| 카카오 로그인 | 미구현 (UI만 존재) | 5% |
| 학습 알림 시스템 | 미구현 | 0% |
| 관리자 기능 | TODO 상태 | 0% |
| 테스트 코드 | 거의 없음 | 2% |

---

## 2. 발견된 문제점 (심각도별)

심각도: 🔴 Critical / 🟡 High / 🟠 Medium / 🟢 Low

### 2.1 🔴 Critical — 즉시 수정 필요

#### ① 소스 코드에 DB 자격증명 하드코딩 ✅ 해결됨

**파일:** `backend/data pipeline/main-script.js`

MongoDB 접속 URI와 계정 비밀번호가 소스 코드에 직접 노출되어 있었습니다. 환경변수로 이관 및 Git 히스토리 정리(filter-repo) 완료.

#### ② 중복된 인증 미들웨어 ✅ 해결됨

**파일:** `backend/src/middleware/auth.ts` vs `authMiddleware.ts`

JWT 검증 로직이 두 파일에 분리 구현되어 있었습니다. `authMiddleware.ts` 삭제, `userRoutes.ts`를 `auth.ts`의 `authenticateUser`로 통일 완료.

#### ③ 프론트엔드 라우트 가드 취약 ✅ 해결됨

**파일:** `frontend/src/ProtectedRoute.tsx`

`localStorage.getItem('user')` 존재 여부만으로 인증 판단하여 만료 토큰으로도 접근 가능했습니다. `isTokenExpired()` 함수 추가 및 `ProtectedRoute`/`LearningRoute` 양쪽에 적용 완료.

---

### 2.2 🟡 High — 출시 전 필수 해결

#### ④ 테스트 코드 전무

`App.test.tsx` 플레이스홀더 1개를 제외하면 테스트가 존재하지 않습니다. 핵심 비즈니스 로직에 대한 단위/통합 테스트가 없어 리팩토링 시 회귀 버그 위험이 큽니다.

- 백엔드: `slidingWindowService`, `checkpointController`, `bookmarkController` 단위 테스트
- 프론트엔드: `FlashCardContainer`, `ProtectedRoute`, `apiClient` 인터셉터 테스트
- E2E: 로그인 → 레벨 선택 → 학습 → 체크포인트 저장 전체 플로우

#### ⑤ 환경변수 검증 없음 ✅ 해결됨

서버 시작 시 필수 환경변수가 없어도 `undefined`로 실행되었습니다. `validateEnv()` 함수 추가로 누락 변수 일괄 검출 후 종료 처리 완료.

#### ⑥ 진도 업데이트 Race Condition

`FlashCardContainer`에서 단어 완료 처리(`completeWordAsync`)가 `await` 없이 비동기로 발사됩니다. 빠른 카드 넘기기 시 진도 데이터 유실 가능성 있음. 요청 큐(queue) 또는 순차 처리 메커니즘 필요.

#### ⑦ CORS 설정 전체 허용

`backend/app.ts`에서 `origin: true`로 CORS 설정, 모든 출처 허용 중. 프로덕션 환경에서는 도메인 화이트리스트 설정 필요.

---

### 2.3 🟠 Medium — 품질 개선 필요

#### ⑧ React 에러 바운더리 누락

컴포넌트 레벨의 ErrorBoundary가 없어 하위 컴포넌트 예외 발생 시 전체 앱이 흰 화면으로 크래시됩니다. 페이지별 ErrorBoundary 래핑과 fallback UI 필요.

#### ⑨ 일부 페이지의 직접 axios 사용

`LevelSelectionPage` 등 일부 컴포넌트에서 공통 `apiClient` 대신 `axios`를 직접 import 사용. 인터셉터(자동 토큰 주입, 갱신 로직)가 적용되지 않아 인증 오류 처리 누락.

#### ⑩ 북마크 페이지네이션 불완전

`BookmarkPage`는 페이지네이션 메타데이터를 기대하지만 백엔드 `getBookmarks` 응답 구조가 일치하지 않을 수 있습니다. 프론트-백 간 API 계약 명확화 필요.

#### ⑪ 입력값 검증 부재

사용자 입력값에 대한 서버 측 sanitization 없음. `WordController`의 `sortBy` 파라미터가 검증 없이 쿼리에 사용됩니다.

#### ⑫ 로깅 시스템 미구축

`console.error` / `console.log`만 사용하며 중앙화된 로깅 없음. Winston, Pino 등의 도입 권장.

---

### 2.4 🟢 Low — 장기 개선 권장

- Redux `kanji` 모듈이 실제 사용되지 않는 컴포넌트 다수 — 스토어 정리 필요
- `SlidingWindowService.getNextWindow`가 매 호출마다 `maxStep` 쿼리 — 캐싱 검토
- API 문서화 없음 — Swagger/OpenAPI 스펙 추가 권장
- `healthCheck` 엔드포인트 없음 — 모니터링 및 배포 자동화에 필요
- 미완성 카카오 로그인 버튼 — UX 혼란 야기, 구현 또는 제거 필요

---

## 3. 완성을 위한 우선순위 작업 계획

### Phase 1 — 보안 및 안정성 (1~2주)

| # | 작업 내용 | 심각도 | 예상 공수 | 상태 |
|---|---|---|---|---|
| 1 | DB 자격증명 환경변수 이관 + Git 히스토리 정리 | 🔴 Critical | 0.5일 | ✅ 완료 |
| 2 | 인증 미들웨어 통합 | 🔴 Critical | 1일 | ✅ 완료 |
| 3 | ProtectedRoute 토큰 유효성 검증 강화 | 🔴 Critical | 0.5일 | ✅ 완료 |
| 4 | 필수 환경변수 시작 시 검증 로직 추가 | 🟡 High | 0.5일 | ✅ 완료 |
| 5 | CORS origin 화이트리스트 설정 | 🟡 High | 0.5일 | - |
| 6 | 진도 업데이트 Race Condition 해결 | 🟡 High | 1일 | - |

### Phase 2 — 신뢰성 및 품질 (2~3주)

| # | 작업 내용 | 심각도 | 예상 공수 |
|---|---|---|---|
| 7 | 핵심 비즈니스 로직 단위 테스트 작성 (백엔드) | 🟡 High | 3일 |
| 8 | 프론트엔드 컴포넌트 테스트 작성 | 🟡 High | 2일 |
| 9 | 페이지별 React ErrorBoundary 추가 | 🟠 Medium | 0.5일 |
| 10 | apiClient 통일 (직접 axios 호출 제거) | 🟠 Medium | 0.5일 |
| 11 | 사용자 입력값 서버 측 검증/sanitization | 🟠 Medium | 1일 |
| 12 | 북마크 페이지네이션 프론트-백 계약 일치 | 🟠 Medium | 1일 |
| 13 | Winston 또는 Pino 로깅 시스템 도입 | 🟠 Medium | 1일 |

### Phase 3 — 완성도 향상 (3~4주)

| # | 작업 내용 | 심각도 | 예상 공수 |
|---|---|---|---|
| 14 | 카카오 로그인 구현 또는 UI 제거 | 🟠 Medium | 1~2일 |
| 15 | `/health` 엔드포인트 추가 | 🟢 Low | 0.5일 |
| 16 | Swagger/OpenAPI 문서 작성 | 🟢 Low | 2일 |
| 17 | SlidingWindowService maxStep 캐싱 | 🟢 Low | 0.5일 |
| 18 | 학습 알림 시스템 구현 | 기능 추가 | 3일 |
| 19 | 학습 데이터 내보내기 기능 | 기능 추가 | 2일 |
| 20 | E2E 테스트 (Playwright/Cypress) | 🟡 High | 3일 |

---

## 4. 아키텍처 및 코드 품질 평가

### 4.1 잘 구현된 부분 (강점)

- 슬라이딩 윈도우 알고리즘의 비즈니스 로직 설계 — 교육적으로 정교하고 구현도 깔끔함
- TypeScript 타입 정의 일관성 — 인터페이스 설계가 전체적으로 잘 되어 있음
- 서비스 레이어 분리 — Controller/Service 패턴이 비교적 잘 지켜짐
- 커스텀 에러 클래스 사용 — HTTP 상태 코드 기반 에러 처리 체계화
- Axios 인터셉터 — 토큰 자동 삽입 및 갱신 로직의 체계적 구현
- 인증 엔드포인트 Rate Limiting 적용
- Redux 최소 사용 원칙 준수 — 전역 상태 남용 없음
- `React.lazy`를 활용한 코드 스플리팅 적용

### 4.2 평가 요약표

| 평가 영역 | 점수 | 코멘트 |
|---|---|---|
| 보안 | 45 / 100 | 자격증명 노출, 취약한 라우트 가드 |
| 테스트 커버리지 | 5 / 100 | 사실상 테스트 없음 |
| 코드 구조 | 72 / 100 | 전반적으로 깔끔하나 중복 있음 |
| 타입 안전성 | 80 / 100 | TypeScript 적극 활용 |
| 에러 처리 | 55 / 100 | 일부 silent failure, 에러 바운더리 없음 |
| API 설계 | 75 / 100 | 일관적이나 문서화 없음 |
| 성능 | 68 / 100 | 기본적인 최적화는 있음 |
| 유지보수성 | 65 / 100 | 문서 부족, 테스트 없어 리팩토링 위험 |
| **전체 완성도** | **62 / 100** | 출시 전 핵심 작업 필요 |

---

## 5. 결론 및 권고사항

KAN-JI 프로젝트는 핵심 학습 기능의 아이디어와 구조가 탄탄합니다. 슬라이딩 윈도우 방식의 학습 알고리즘은 교육적으로 가치 있는 접근이며, 전체 코드 구조도 유지보수 가능한 수준으로 작성되어 있습니다. 다만 보안 취약점과 테스트 부재로 인해 현재 상태로는 프로덕션 배포를 권장하지 않습니다.

### 최우선 권고 (출시 전 반드시)

1. ~~소스 코드에서 DB 자격증명 즉시 제거 및 Git 히스토리 정리~~ ✅ 완료
2. ~~인증 미들웨어 통합 및 ProtectedRoute 강화~~ ✅ 완료
3. 핵심 비즈니스 로직 단위 테스트 최소 70% 커버리지 달성
4. ~~환경변수 검증 로직 추가~~ ✅ 완료

### 단기 권고 (1개월 내)

1. React ErrorBoundary 전 페이지 적용
2. apiClient 사용 일원화 (직접 axios 호출 제거)
3. 사용자 입력값 서버 측 검증 추가
4. CORS 화이트리스트 설정
5. 로깅 시스템 도입 (Winston/Pino)

### 장기 권고 (분기 내)

1. Swagger/OpenAPI 문서 작성
2. E2E 테스트 자동화 (Playwright 또는 Cypress)
3. 카카오 로그인 완성 또는 제거
4. 학습 알림 및 데이터 내보내기 기능 구현
5. CI/CD 파이프라인 구축 (GitHub Actions 등)

---

*작성일: 2026년 4월 4일 | Critical 이슈 해결 완료: 2026년 4월 4일*
