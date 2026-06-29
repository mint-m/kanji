# CLAUDE.md

> **기술 문서**: 아키텍처, API 명세, DB 스키마 → [docs/PROJECT_DOCS.md](./docs/PROJECT_DOCS.md)

---

## 개발 원칙

- 지금 필요한 것만 작성 — 미래 요구사항을 위한 코드 금지
- 코드를 추가하기 전에 삭제할 수 있는지 먼저 확인
- 함수/컴포넌트 하나에 하나의 책임
- 실제 중복이 생겼을 때만 추상화 (rule of three)

---

## 기술 스택

**Frontend**: React 18 + TypeScript, Redux Toolkit (최소), Vanilla Extract, React Router v6

**Backend**: Node.js + Express + TypeScript, MongoDB + Mongoose, Google & Kakao OAuth 2.0 + JWT

---

## 핵심 개념

**슬라이딩 윈도우 학습 시스템**

- Window: 3단계 연속 범위 (1-3 → 2-4 → 3-5 ...), 레벨 끝에서 자동 순환
- Pass: 현재 덱의 처음~끝 1회 순회
- 완전 습득 조건: 현재 윈도우의 모든 단어가 "알았음" 처리될 때까지 패스 반복
- Dual Sessions: Main (체계적 학습) + Sub (북마크 복습), 각 독립 진행

**아키텍처 원칙**

- Minimal Redux: 인증 상태와 활성 세션 타입만 전역 관리
- Services over Redux: 모든 API 호출은 서비스 레이어를 통해 직접 수행
- Model-first: 핵심 학습 로직은 컨트롤러가 아닌 Mongoose 모델 메서드에 위치

---

## 개발 명령어

```bash
yarn start          # Frontend + Backend 동시 실행
```

| 영역 | 명령어 |
|------|--------|
| Frontend | `cd frontend && yarn start` |
| Backend | `cd backend && yarn dev` |
| 테스트 | `yarn test` (각 디렉토리) |
| E2E | `yarn test:e2e` |

- Frontend: http://localhost:4200
- Backend: http://localhost:8000

---

## 환경 변수

**backend/.env**

```bash
MONGO_URI=mongodb://localhost:27017/kanji
PORT=8000
SESSION_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
KAKAO_REST_API_KEY=your-kakao-key
```

**frontend/.env**

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-google-id
```

---

## 커밋 컨벤션

**포맷**: `<type>: <한국어 설명>` — scope `()` 없음, 끝 마침표 없음

| type | 사용 시점 |
|------|-----------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 코드 구조 개선 |
| `perf` | 성능 개선 |
| `test` | 테스트 추가·수정 |
| `style` | 스타일·디자인 변경 (로직 무관) |
| `chore` | 빌드·설정·의존성 변경 |
| `docs` | 문서 수정 |

- 하나의 커밋 = 하나의 논리적 변경
- 같은 목적이면 함께, 다른 목적이면 분리
- WIP 커밋 지양 — 완료된 단위로 커밋

```
feat: 학습 대시보드 추가
fix: $lookup collection name 'words' → 'word' 수정
refactor: 미사용 미들웨어 제거 및 토큰 추출 함수 분리
perf: 레벨별 진행률 조회 쿼리 aggregation으로 최적화
test: userStatsController 테스트 보강
```
