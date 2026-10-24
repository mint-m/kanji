# kanji (칸지)

> 일본어 능력시험(JLPT) 단어 학습 애플리케이션

**윈도우로 익히고, 간격 복습으로 굳히는** 일본어 단어 학습 플랫폼입니다. 3스텝씩 밀어 가는 범위 학습으로 단어를 익히고, 익힌 단어는 1·3·7일 간격으로 다시 물어 오래 기억하게 합니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0-green.svg)](https://nodejs.org/)

---

## 📚 주요 기능

### 🎯 진도 학습 — 범위를 완전히 익히고 넘어가기

- **3스텝 슬라이딩 윈도우**: 1-3 → 2-4 → 3-5 방식으로 한 스텝씩 밀며 레벨 끝까지 (끝에서는 9-1, 10-2로 레벨 안에서 순환)
- **패스 반복**: 한 바퀴 돈 뒤 모른 단어만 다시 섞어 반복 — 범위의 모든 단어를 알아야 다음 범위로
- **집중 학습**: 한 스텝만 골라 완전히 익힐 때까지 반복 (진도 학습 위치와 따로 기록)

### 🔁 오늘의 복습 — 간격 반복

- 처음 "알아요"를 누른 단어는 다음 날부터 **1·3·7·14·30·60일** 간격으로 다시 나온다
- 복습에서 잊은 단어는 그 자리에서 다시 묻고, 다음 날 한 번 더 나온다

### 🃏 학습 카드

- 카드를 누르거나 `Space`로 읽기·뜻 공개, `←` 몰라요 / `→` 알아요 — 키보드만으로 학습
- 발음 듣기(브라우저 음성 합성), 한자를 누르면 음·훈과 뜻 풀이
- 이번 범위에서 몇 개를 익혔는지 진행 막대로 표시

### 📈 홈과 기록

- 홈: 오늘의 복습, 이어 할 학습, 연속 학습일과 오늘 학습량/하루 목표
- 기록: 레벨별 익힌 단어·장기 기억, 복습 대기, 학습한 날

### ⭐ 북마크

- 어려운 단어를 ☆로 모아(최대 150개) 메모를 남기고, 북마크 학습으로 회차 반복

---

## 🚀 빠른 시작

### 필수 요구사항

- **Node.js**: 18.0 이상
- **MongoDB**: 4.4 이상
- **Yarn**: 1.22 이상 (또는 npm)

### 설치 및 실행

#### 1. 저장소 클론

```bash
git clone https://github.com/mint-m/kanji.git
cd kanji
```

#### 2. 의존성 설치

```bash
# 루트에서 전체 설치
yarn install

# 또는 개별 설치
cd backend && yarn install
cd ../frontend && yarn install
```

#### 3. 환경 변수 설정

**Backend (.env)**:

```bash
cd backend
cp .env.example .env
# .env 파일 편집:
# - MONGO_URI
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - JWT_SECRET
```

**Frontend (.env)**:

```bash
cd frontend
cp .env.example .env
# .env 파일 편집:
# - REACT_APP_API_URL
# - REACT_APP_GOOGLE_CLIENT_ID
```

#### 4. 개발 서버 실행

**전체 스택 동시 실행** (권장):

```bash
# 루트 디렉토리에서
yarn start
```

- Frontend: http://localhost:4200
- Backend: http://localhost:8000

**운영 DB 없이 실행** (메모리 MongoDB + 샘플 단어 124개):

```bash
# 루트 디렉토리에서 — 종료하면 데이터도 사라진다
yarn start:memory
```

- Atlas 접속 정보가 없어도 된다. 시작 로그에 나오는 한 줄을 브라우저 콘솔에 붙여넣으면 개발용 계정으로 로그인된다
- `.env`에 Google·카카오 키가 있으면 실제 로그인도 동작한다 (사용자는 메모리 DB에만 생긴다)

**개별 실행**:

```bash
# Backend
cd backend
yarn dev

# Frontend (별도 터미널)
cd frontend
yarn start
```

---

## 📖 프로젝트 구조

```
kanji/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── store/         # Redux 스토어
│   │   ├── services/      # API 서비스
│   │   └── utils/         # 유틸리티
│   └── package.json
├── backend/               # Express 백엔드
│   ├── src/
│   │   ├── controllers/   # 컨트롤러
│   │   ├── models/        # Mongoose 모델
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직
│   │   └── middleware/    # 미들웨어
│   └── package.json
├── docs/                 # 📚 문서 모음
├── CLAUDE.md              # Claude Code 가이드
└── README.md              # 이 파일
```

---

## 🎓 사용 방법

1. **로그인** — Google 또는 카카오 계정
2. **학습 시작** — 학습 방식(진도 학습·집중 학습) → 레벨(일상·N5~N1) → 범위를 고른다
3. **학습 카드** — 읽기·뜻을 떠올려 보고 "알아요/몰라요". 한 바퀴가 끝나면 모른 단어만 다시
4. **범위 완료** — 모두 알면 다음 범위로. 레벨의 마지막 범위를 마치면 다음 레벨을 권한다
5. **오늘의 복습** — 다음 날부터 홈에 복습할 단어 수가 뜬다
6. **기록** — 익힌 단어와 장기 기억, 연속 학습일 확인

---

## 🛠️ 기술 스택

### Frontend

- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Redux Toolkit** - 상태 관리 (user, kanji 모듈)
- **Vanilla Extract** - CSS-in-JS (타입 안전 CSS)
- **React Router v6** - 라우팅
- **Axios** - HTTP 클라이언트

### Backend

- **Node.js** - 런타임
- **Express** - 웹 프레임워크
- **TypeScript** - 타입 안정성
- **MongoDB** - 데이터베이스
- **Mongoose** - ODM
- **JWT** - 토큰 기반 인증

### 인프라

- **Google OAuth 2.0** - 소셜 로그인
- **Kakao OAuth 2.0** - 카카오 로그인
- **MongoDB Atlas** - 클라우드 DB
- **Vercel** - 프론트엔드 배포
- **Render** - 백엔드 배포 (`render.yaml` Blueprint)

> 배포 절차는 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) 참조.

---

## 📊 데이터베이스 구조

### 주요 컬렉션

| 컬렉션             | 용도                   | 비고               |
| ------------------ | ---------------------- | ------------------ |
| `user`             | 사용자 인증            | Google/Kakao OAuth |
| `word`             | 단어 마스터 데이터     | JLPT N5~N1         |
| `user_checkpoints` | 세션 상태 + 체크포인트 | 진도·집중 학습 독립 |
| `word_progress`    | 단어별 완료 상태       | 북마크 포함        |
| `word_review`      | 단어별 간격 복습 일정  | 사용자·단어당 1건  |

> 상세 스키마는 [PROJECT_DOCS.md](./docs/PROJECT_DOCS.md#데이터베이스-구조)를 참조하세요.

---

## 🔧 개발

### 스크립트

**Frontend**:

```bash
yarn start       # 개발 서버 (port 4200)
yarn build       # 프로덕션 빌드
yarn test        # 테스트 실행
yarn lint        # ESLint 검사
```

**Backend**:

```bash
yarn dev         # 개발 서버 (nodemon, port 8000)
yarn start       # 프로덕션 실행
yarn build       # TypeScript 컴파일
yarn test        # 테스트 실행
```

---

## 📝 문서

- **[PROJECT_DOCS.md](./docs/PROJECT_DOCS.md)** - 📚 전체 기술 문서 (한글)

  - 시스템 아키텍처
  - 데이터베이스 구조
  - API 엔드포인트
  - 슬라이딩 윈도우 상세
  - 체크포인트 시스템
  - 프론트엔드 마이그레이션

- **[CLAUDE.md](./CLAUDE.md)** - 🤖 Claude Code 가이드
  - Development commands
  - Project structure
  - Key concepts
  - Important notes

---

## 🗺️ 로드맵

> 안정성·완성도·코드 축소를 우선한다. v5 리뉴얼로 "익힌 단어를 오래 기억하게 하는" 부분을 채웠다.

### Phase 1 — 핵심 시스템 (완료)

- ✅ 슬라이딩 윈도우·패스 반복, 체크포인트 자동 저장/복원, 북마크, 진도·집중 이중 세션

### Phase 2 — 프론트엔드·인증 (완료)

- ✅ Redux Toolkit·Vanilla Extract, 카카오 OAuth, 완전 습득형 학습 로직

### Phase 3 — v5 리뉴얼 (2026-10)

- ✅ 간격 복습(오늘의 복습)과 "익힌 단어·장기 기억" 기록
- ✅ 오늘 할 일 중심 홈, 서비스 소개 화면, 학습 시작 화면 통합
- ✅ 학습 카드 재설계 (단축키·발음·범위 진행·모바일 한자 시트), 북마크 학습 회차 반복
- ✅ 보안·정합성 수정 (카카오 OAuth state, 연속 학습일, 서브 루프 등), 메모리 DB 통합 테스트

### 보류

- ⏸️ CRA → Vite 전환 (배포 설정과 함께)
- ⏸️ 다크 모드
- ⏸️ 모바일 앱 (React Native) · 오프라인 모드

---

## 🤝 기여하기

브랜치·커밋·PR·이슈 규칙은 [CLAUDE.md](./CLAUDE.md#commit-convention)가 단일 출처입니다. PR과 이슈는 GitHub에서 템플릿이 자동으로 채워집니다.

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

---

## 👨‍💻 개발자

**Minwoo** - [GitHub](https://github.com/mint-m)

---

## 🙏 감사의 말

- JLPT 단어 데이터 제공처
- React 및 Node.js 커뮤니티
- 모든 기여자들

---

## 📧 문의

- GitHub Issues: [Create an issue](https://github.com/mint-m/kanji/issues)
- Email: fwwfly@gmail.com

---

**Happy Learning! 📖✨**
