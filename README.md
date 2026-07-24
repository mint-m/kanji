# kanji (칸지)

> 일본어 능력시험(JLPT) 단어 학습 애플리케이션

슬라이딩 윈도우 덱 시스템을 활용한 효율적인 일본어 단어 학습 플랫폼입니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0-green.svg)](https://nodejs.org/)

---

## 📚 주요 기능

### 🎯 완전 습득형 학습 시스템

- **3단계 슬라이딩 윈도우**: 1-3 → 2-4 → 3-5 방식의 점진적 학습
- **패스(Pass) 반복**: 모른 단어만 추출해 완전히 알 때까지 반복 순환
- **윈도우 완료 조건**: 덱 전체 단어를 "알았음" 처리해야 다음 윈도우 진행
- **순환 복습**: 레벨 경계를 넘어가는 자동 순환 (9-1, 10-2)

### 💾 자동 체크포인트

- **실시간 저장**: 학습 진행 상황 자동 저장
- **세션 복원**: 앱 재접속 시 이전 위치에서 재개
- **데이터 안전**: MongoDB 기반 안정적 저장

### ⭐ 북마크 시스템

- **어려운 단어 표시**: 클릭 한 번으로 북마크 등록
- **우선 복습**: 북마크된 단어 덱 앞쪽 40%에 우선 배치
- **독립 관리**: Main/Sub 세션 간 북마크 공유

### 🔀 이중 세션

- **Main 세션**: 체계적인 순차 학습
- **Sub 세션**: 북마크 중심 집중 복습
- **독립 진행**: 각 세션의 진행 상황 별도 관리

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

### 1. 로그인

- Google 또는 카카오 계정으로 로그인

### 2. 학습 세션 시작

- **Main 세션**: 체계적 학습
  - 레벨 선택 (N5 ~ N1)
  - 시작 단계 선택 (1-3, 2-4, ...)
- **Sub 세션**: 북마크 복습
  - 북마크한 단어 집중 복습

### 3. 플래시카드 학습

- 단어 학습 (히라가나 → 한자 → 의미)
- **알았음/모름** 선택
- **북마크** 토글 (⭐)
- 자동 다음 단어 진행

### 4. 패스(Pass) 반복

- 패스 완료 후 "모름" 단어가 있으면 → 재셔플 후 새 패스 시작
- 모든 단어 "알았음" → 윈도우 완료 → 다음 윈도우 자동 생성
- 예: 윈도우 {1,2,3} 완료 → {2,3,4} 자동 생성

### 5. 진행 상황 확인

- 대시보드에서 레벨별 진행률 확인
- 북마크 페이지에서 어려운 단어 관리

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
| `user_checkpoints` | 세션 상태 + 체크포인트 | Main/Sub 독립      |
| `word_progress`    | 단어별 완료 상태       | 북마크 포함        |

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

### 브랜치 전략

- `main` - 프로덕션 브랜치
- `feat/*` - 기능 개발
- `fix/*` - 버그 수정

### 커밋 컨벤션

```
feat: 새로운 기능
fix: 버그 수정
docs: 문서 변경
style: 코드 스타일 변경
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드 설정 등
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

> 현재 **유지보수·종결 단계**입니다. 신규 기능보다 안정성·완성도·코드 축소를 우선하며, 아래 계획 항목은 범위 밖으로 보류되어 있습니다.

### Phase 1 — 핵심 시스템 (완료)

- ✅ 슬라이딩 윈도우 시스템
- ✅ 체크포인트 자동 저장/복원
- ✅ 북마크 시스템
- ✅ Main/Sub 이중 세션
- ✅ API 서비스 레이어

### Phase 2 — 프론트엔드·인증 (완료)

- ✅ Redux Store 구조 (user, kanji 모듈)
- ✅ 프론트엔드 핵심 컴포넌트 구현 (FlashCard, SelectLevel, SelectStep 등)
- ✅ UserProfilePage (세션 전환)
- ✅ 카카오 OAuth 로그인 추가
- ✅ Vanilla Extract 마이그레이션 (Styled Components 제거)
- ✅ 완전 습득형 학습 로직 구현 (패스 반복, 윈도우 완료 조건)

### 보류 (종결 단계 범위 밖)

- ⏸️ 학습 통계 대시보드 고도화 / 연속 학습일 추적 UI
- ⏸️ 학습 패턴 분석 · 추천 시스템
- ⏸️ 모바일 앱 (React Native) · 오프라인 모드

---

## 🤝 기여하기

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

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
