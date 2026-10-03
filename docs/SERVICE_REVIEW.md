# 서비스 종합 검토 보고서

> 검토일: 2026-10-03 · 기준: `origin/main` 9eb9b1c (+ 열린 PR #24) · 관점: 멘토링 및 실서비스 총괄
> 이전 `docs/consulting-report.md`를 대체한다. 그 문서의 미해결 항목(ErrorBoundary, CI, 로깅)은 아래 로드맵에 포함했다.

## 요약

코드와 설계는 양호하지만 서비스는 현재 정상 운영 상태가 아니다. 검토 시점에 프로덕션 API가 응답하지 않았다. main에는 사용자가 빠져나오지 못하거나 기능이 아예 동작하지 않는 결함 2건이 있는데, 통과하는 테스트 140건 중 어느 것도 이를 잡지 못한다.

| 영역 | 평가 | 근거 |
| --- | --- | --- |
| 도메인 설계·코드 구조 | 양호 | 모델 메서드에 로직 집중, 타입체크·프로덕션 빌드 통과 |
| 학습 플로우 | 보통 | 윈도우·패스 로직은 정확하나 재진입·실패 경로에서 막힌다 (F1, F2) |
| 보안 | 양호 | 기본기는 충실하고, Google 토큰 발급 대상 미검증 1건 (S1) |
| 프론트 UX·성능 | 미흡 | 북마크 복습 전면 실패 (FE1), 9.5MB 폰트 (FE2) |
| 테스트 | 보통 | 142건 중 140건 통과. 프론트–백엔드 계약과 이탈 시나리오는 미검증 |
| 운영·배포 | 미흡 | API 무응답, CI·모니터 없음, 문서의 도메인이 타인 사이트 (O1, O2, O4, O5) |

## 검토 범위와 기준

| 브랜치 | 상태 | main 대비 (앞/뒤) | 권고 |
| --- | --- | --- | --- |
| `origin/main` | 기준선 (2026-07-24) | — | — |
| `claude/project-comparison-analysis-vvwfzi` | PR #24 OPEN, 문서 전용 | +3 / 0 | 보완 후 머지 |
| `refactor/auth-banner-context` · `claude/ci-event-review-gday90` | PR #19 스쿼시 머지됨 | +3 / −3 | 삭제 |
| `claude/claude-md-review-aov5sn` | PR #20 스쿼시 머지됨 | +1 / −3 | 삭제 |
| `claude/kanji-naming-consolidation-cntzxz` | PR #22 스쿼시 머지됨 | +1 / −1 | 삭제 |
| `refactor/auth-banner-and-types-cleanup` | PR 없음, 내용은 #19로 흡수됨 | +2 / −25 | 삭제 |
| `feat/deploy-setup` | 482d2bd로 머지됨 | 0 / −11 | 삭제 |

방법: 코드 정독(백엔드 모델·서비스·컨트롤러·미들웨어, 프론트 서비스·학습 UI), 깨끗한 체크아웃에서 테스트·빌드 실행, 배포 설정과 프로덕션 URL 확인, 문서 대조.

## 아키텍처

```
브라우저(React SPA) ──정적 파일──> Vercel
        └──REST + Bearer JWT──> Render(Express API, free) ──> MongoDB Atlas M0
                                       └──> Google OAuth · 카카오 OAuth · 네이버 사전 API
```

브라우저는 Vercel에서 화면만 받고 모든 데이터는 Render API를 거친다. API 하나가 멈추면 로그인부터 학습까지 모두 멈춘다. 모든 단계가 무료 티어라서 휴면과 콜드 스타트가 설계 제약이 된다.

## 결함 목록

### 핵심 학습 플로우

| # | 결함 | 재현 조건 → 결과 | 근거 | 우선순위 |
| --- | --- | --- | --- | --- |
| F1 | 윈도우 완료 후 재진입 시 진행 불가 | 서브 완료 화면의 [홈으로] 또는 메인에서 [다음 윈도우로] 전에 이탈 후 재진입 → "처리 중..."만 뜨고 진행 버튼이 없다 | `FlashCardContainer.tsx` — `passResult`가 complete-word 응답으로만 채워진다. 서버는 `currentIndex = 덱 길이`를 돌려준다 | P0 |
| F2 | 진행 동기화 실패가 조용히 묻힘 | complete-word 실패(타임아웃·콜드 스타트) 시 화면만 진행 → 서버 인덱스가 뒤처져 패스 끝에서 F1과 같은 상태로 멈춘다 | `FlashCardContainer.tsx`(`console.warn`만 함), `deckController.ts`(제출 단어가 현재 단어인지 검사하지 않음) | P1 |
| F3 | 레벨 완료 통계가 메인 세션에서 기록되지 않음 | 8-10 완료 시 `steps`가 먼저 9-1로 바뀐 뒤 `steps.end >= maxStep`을 검사한다. 서브는 마지막 스텝 하나로 레벨 전체가 완료 처리된다 | `deckController.ts` `completeDeck` | P2 |
| F4 | 레벨 끝(10-2) 도달 시 안내 없이 이동 | 축하·요약 없이 `/level-setup`으로 이동한다 | `FlashCardPage.tsx` `handleAdvance` | P2 |
| F5 | 기존 세션에 대한 PATCH `/me/checkpoint`가 덱을 재생성하지 않음 | UI는 항상 DELETE 후 호출해 도달하지 않지만 API로는 열려 있다 | `userController.ts` `updateCheckpoint` | P2 |
| F6 | 윈도우 이동 시 `is_window_completed` 부분 리셋 | 마지막 패스 단어만 리셋된다. 다음 윈도우 첫 패스에서 덮어써져 현재 영향은 없다 | `userCheckpoint.ts` `generateNextSlidingWindow` | P3 |

### 보안·인증

| # | 항목 | 내용 | 우선순위 |
| --- | --- | --- | --- |
| S1 | Google access token의 aud 미검증 | `/google/login`은 받은 토큰으로 userinfo만 조회한다. 다른 앱이 받은 같은 사용자의 토큰으로도 로그인된다. `/link/google`도 같다. → tokeninfo의 `aud` 확인으로 수정 | P1 |
| S2 | Google 경로의 이메일 인증 여부 미확인 | 이메일이 같으면 기존 계정에 자동 연동되는데, 카카오와 달리 `email_verified`를 보지 않는다 | P2 |
| S3 | 무인증 외부 API 프록시 | `/api/words/kanjiSearch`가 로그인·레이트 리밋 없이 네이버 사전의 비공개 내부 API를 호출한다 | P2 |
| S4 | 토큰 수명 관리 | JWT를 localStorage에 저장하고 `/refresh`가 무제한 재발급한다. XSS 싱크가 없어 현 규모에서는 수용 가능 | P3 |
| S5 | 레이트 리밋·보안 헤더 범위 | 인메모리·UA 포함 키, 보안 헤더는 `/api/auth`에만 적용 | P3 |
| S6 | 연동 중복 조회에 `$elemMatch` 미사용 | 실제 충돌 가능성은 낮다 | P3 |

### 운영·배포

| # | 항목 | 관찰 내용 | 우선순위 |
| --- | --- | --- | --- |
| O1 | 프로덕션 API 무응답 | `https://kanji-api.onrender.com`에 3회(90초·30초·45초) 요청, TLS 연결 후 응답 0바이트. 유력 가설: Atlas 무료 클러스터가 30일 무접속으로 일시정지 → `server.ts`가 DB 연결 실패 시 `process.exit(1)` | P0 |
| O2 | 문서의 프론트 도메인이 다른 사이트 | `kanji.vercel.app`은 타인의 시작 페이지를 서빙한다. 프로젝트의 `*-mint-ms-projects.vercel.app`은 Vercel SSO로 리다이렉트된다 | P0 |
| O3 | 콜드 스타트 vs 클라이언트 타임아웃 | Render 무료 플랜은 15분 유휴 시 스핀다운, 재기동 약 1분. `apiClient` 타임아웃은 10초 | P1 |
| O4 | CI 없음 | `.github/workflows` 없음. Render는 `autoDeploy: true` | P1 |
| O5 | 관측성 부재 | 에러 추적·가동률 모니터 없음. 헬스체크 `/`는 DB를 확인하지 않는다 | P1 |
| O6 | 문서–코드 불일치 | DEPLOYMENT.md는 OAuth 세션 쿠키를 전제하지만 실제로는 헤더 JWT만 쓴다 | P3 |

출처: [Render – Free instance limits](https://render.com/docs/free), [MongoDB Atlas – Free cluster limitations](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)

### 프론트엔드

| # | 항목 | 내용 | 우선순위 |
| --- | --- | --- | --- |
| FE1 | 북마크 복습 페이지 항상 실패 | `limit: 150` 요청 vs 서버 검증 `max: 100` → 400. 화면에는 "네트워크 연결을 확인해주세요"가 뜬다 | P0 |
| FE2 | 9.5MB 폰트 번들 | `NotoSansJP-VariableFont_wght.ttf`(9,532,768바이트)를 `@font-face`로 직접 서빙 | P1 |
| FE3 | ErrorBoundary 없음 | 렌더 예외·lazy 청크 로드 실패 시 흰 화면 | P2 |
| FE4 | 에러 문구가 원인과 무관 | 4xx·5xx·타임아웃을 대부분 "네트워크 확인"으로 묶는다 | P2 |
| FE5 | 미사용 의존성·예외 규칙 | `react-awesome-slider`, `lodash`, `@vanilla-extract/dynamic` 미사용, ESLint axios 예외의 `LevelSelectionPage.tsx`는 더 이상 axios를 쓰지 않음 | P3 |

## 테스트와 CI (검토 시점)

| 영역 | 결과 | 커버리지 (문장 / 분기) | 비고 |
| --- | --- | --- | --- |
| 백엔드 Jest | 8개 스위트, 79/79 통과 | 60.8% / 41.3% | 라우트 검증 레이어 테스트 없음 |
| 프론트 RTL | 8개 스위트, 47/49 통과 | 23.6% / 15.3% | `KakaoOAuthCallback` 2건은 로컬 `.env`가 있어야 통과하는 환경 의존 테스트 |
| E2E Playwright | 14/14 통과 | — | 재진입·동기화 실패·북마크 복습 시나리오 없음 |
| CI | 없음 | — | — |

## 기술부채 (삭제 후보)

| 대상 | 상태 |
| --- | --- |
| `filterDeckByUserProgress`의 북마크 우선 배치·`maxWords` 분기 | 유일한 호출부가 기본값만 넘겨 항등 함수와 같다 |
| `levelsCompleted` 기록 | 로직이 틀렸고(F3) 프론트가 읽지 않는다 |
| PATCH `/me/checkpoint`의 기존 세션 갱신 분기 | UI에서 도달하지 않고 동작도 틀렸다(F5) |
| 응답의 `studyStats`·`recommendedAction`·`masteryLevel` | 화면에서 쓰지 않는다 |
| `GET /api/auth/verify`, `POST /api/auth/logout`, `GET /api/users/me` | 프론트 호출 없음 |
| `/google/login` | S1 수정 시 불필요 |
| 오래된 브랜치 6개 | 모두 머지되었거나 흡수됨 |

## 로드맵

공수는 1인 기준 추정이다. 상태는 작업하면서 갱신한다.

| 우선 | 작업 | 관련 | 공수 | 완료 기준 | 상태 |
| --- | --- | --- | --- | --- | --- |
| P0 | 프로덕션 API 복구: Atlas 클러스터 재개, Render 배포 로그 확인 | O1 | 0.5일 | `GET /` 200, 로그인·덱 조회 성공 | 미착수 — Render·Atlas 대시보드 접근 필요 |
| P0 | 실제 프론트 도메인 확정, `ALLOWED_ORIGINS`·OAuth 리다이렉트·문서 일치 | O2 | 0.5일 | 외부 브라우저에서 Google·카카오 로그인 성공 | 미착수 — 실제 공개 도메인 확인 필요 |
| P0 | 완료 화면 재진입 막힘 수정 | F1 | 0.5일 | 신규 E2E 통과 | 완료 (`fix/review-p0`, 머지·배포 대기) |
| P0 | 북마크 복습 조회 상한 불일치 수정 | FE1 | 0.25일 | 라우트 검증 테스트 통과 | 완료 (`fix/review-p0`, 머지·배포 대기) |
| P1 | GitHub Actions CI + Render 배포를 CI 통과 후로 | O4 | 1일 | PR에 체크 표시 | 완료 (`fix/review-p1`) — Render가 블루프린트 동기화 중이어야 `checksPass`가 적용됨 |
| P1 | 가동률 모니터 + DB 상태를 보는 헬스체크 | O5, O3 | 0.5일 | 장애 시 알림 수신 | 코드 완료 (`fix/review-p1`) — 저장소 변수 `HEALTHCHECK_URL` 등록 필요 |
| P1 | complete-word 서버 멱등화 + 실패 안내·재시도 | F2 | 1.5일 | 500 주입 E2E에서 복구 가능 | 완료 (`fix/review-p1`) |
| P1 | Google access token의 발급 대상(aud) 확인 (API 변경 없는 방식으로 변경) | S1 | 0.5일 | 타 앱 토큰으로 로그인 불가 | 완료 (`fix/review-p1`) |
| P1 | 콜드 스타트 대응 안내 + 첫 요청 타임아웃 상향 | O3 | 0.5일 | 유휴 후 첫 진입 성공 | 완료 (`fix/review-p1`) |
| P1 | 9.5MB TTF → 분할 woff2 | FE2 | 0.5일 | 초기 전송량 1MB 미만 | 완료 (`fix/review-p1`) — 빌드 산출물 13MB → 3.5MB |
| P2 | 죽은 코드·미사용 엔드포인트·의존성 삭제 (F3, F5 포함) | 부채 | 1일 | 테스트 통과, PROJECT_DOCS 갱신 | 미착수 |
| P2 | 최상위 ErrorBoundary + 원인별 에러 문구 | FE3, FE4 | 0.5일 | 예외 시 복구 화면 표시 | 미착수 |
| P2 | PR #24 보완 후 머지, 브랜치 정리, DEPLOYMENT.md 정리 | 문서 | 0.5일 | main과 문서가 일치 | 미착수 |
| P2 | ~~카카오 테스트 env 의존 제거~~(CI 도입하며 완료), Google `email_verified` 확인, 레벨 끝 안내 | S2, F4 | 0.5일 | 깨끗한 체크아웃에서 전부 통과 | 일부 완료 |

## 종결 완료 기준

- [ ] P0 결함 0건
- [ ] main에서 CI 통과
- [ ] 가동률 알림 설정
- [ ] 문서의 URL·동작이 실제와 일치
- [ ] 휴면 대비 런북(데이터 export 백업, Atlas 재개 → Render 재배포 → 점검 로그인 순서)
