# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

> **📚 Technical Docs**: See [docs/PROJECT_DOCS.md](./docs/PROJECT_DOCS.md) for architecture, API specs, and database schemas.

---

## Development Philosophy

### Core Principles

1. **Avoid Over-Engineering**
   - Write only what is needed NOW
   - Don't build for hypothetical future requirements
   - Simple solutions over complex abstractions

2. **Clean & Minimal Code**
   - Prioritize readability and maintainability
   - Remove unused code immediately
   - One responsibility per function/component

3. **Iterate, Don't Perfect**
   - Ship working code first
   - Refactor when actually needed, not "just in case"
   - Real user feedback > theoretical optimization

4. **YAGNI (You Aren't Gonna Need It)**
   - No premature abstraction
   - No "future-proof" layers without clear use case
   - Delete more, add less

### Code Review Checklist

Before writing or modifying code, ask:

- ❌ Is this solving a problem we don't have yet?
- ❌ Can this be done with fewer lines/files?
- ❌ Am I adding unnecessary abstraction?
- ✅ Does this solve the immediate requirement?
- ✅ Is this code self-explanatory?
- ✅ Can I delete something instead of adding?

---

## Development Commands

### Full Stack

```bash
yarn start    # Frontend + Backend 동시 실행
```

- Frontend: http://localhost:4200
- Backend: http://localhost:8000

### Frontend

```bash
cd frontend
yarn start    # 개발 서버
yarn build    # 프로덕션 빌드
yarn test     # 테스트
```

### Backend

```bash
cd backend
yarn dev      # 개발 서버 (nodemon)
yarn test     # 테스트
```

### E2E

```bash
yarn test:e2e     # Playwright 전체 실행
yarn test:e2e:ui  # UI 모드
```

---

## Tech Stack

**Frontend**: React 18 + TypeScript, Redux Toolkit (최소), Vanilla Extract, React Router v6

**Backend**: Node.js + Express + TypeScript, MongoDB + Mongoose, Google & Kakao OAuth 2.0 + JWT

---

## Core Concepts

### Sliding Window Learning System

- **Window**: 3단계 연속 범위 (1-3 → 2-4 → 3-5 ...), 레벨 끝에서 자동 순환
- **Pass**: 현재 덱의 처음~끝 1회 순회
- **완전 습득 조건**: 현재 윈도우의 모든 단어가 "알았음" 처리될 때까지 패스 반복
- **Dual Sessions**: Main (체계적 학습) + Sub (북마크 복습), 각 독립 진행

### Architecture Principles

- **Minimal Redux**: 인증 상태와 활성 세션 타입만 전역 관리. API 상태는 서비스 레이어에서 직접 처리
- **Services over Redux actions**: 모든 API 호출은 서비스 레이어를 통해 직접 수행
- **Model-first business logic**: 핵심 학습 로직은 컨트롤러가 아닌 Mongoose 모델 메서드에 위치
- **Unified session model**: 세션 상태와 체크포인트를 단일 도큐먼트로 통합 관리

---

## Environment Variables

**Backend (.env)**:

```bash
MONGO_URI=mongodb://localhost:27017/kanji
PORT=8000
SESSION_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
KAKAO_REST_API_KEY=your-kakao-key
```

**Frontend (.env)**:

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-google-id
```

---

## Commit Convention

### Format

```
<type>: <description>
```

- **scope 없음**: `fix(auth):` ❌ → `fix:` ✅
- **설명은 한국어**로 작성
- 제목 끝에 마침표 없음

### Types

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

### Rules

- 하나의 커밋은 하나의 논리적 변경만 포함
- 여러 파일이 같은 목적이면 함께 커밋, 다른 목적이면 분리
- 완료된 작업 단위로 커밋 (WIP 커밋 지양)

### Examples

```
feat: 학습 대시보드 추가
fix: $lookup collection name 'words' → 'word' 수정
refactor: 미사용 미들웨어 제거 및 토큰 추출 함수 분리
perf: 레벨별 진행률 조회 쿼리 aggregation으로 최적화
test: userStatsController 테스트 보강
```

---

## Development Workflow

### When Starting a New Feature

1. ✅ **Check if it's really needed now** (avoid over-engineering)
2. ✅ **Write minimal code** to solve the immediate problem
3. ✅ **Test with real data** before adding more complexity
4. ✅ **Refactor only when you see duplication** (rule of three)

### When Reviewing Code

1. ❌ **Remove before adding** — can we delete something instead?
2. ❌ **Challenge abstractions** — is this really needed?
3. ✅ **Focus on clarity** — is it obvious what this does?
4. ✅ **Test edge cases** — does it handle errors gracefully?

---

## Important Notes

- **Code is Truth**: When in doubt, check actual code over this document
- **Ask, Don't Assume**: If structure seems outdated, check with developer
- **Iterate**: Start simple, evolve based on real needs
