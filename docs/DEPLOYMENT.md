# 배포 가이드

권장 구성: **프론트 = Vercel · 백엔드 = Render · DB = MongoDB Atlas**
(OAuth 세션 쿠키가 `secure` + `sameSite=none` 이라 양쪽 모두 HTTPS 필수 → 세 서비스 모두 HTTPS 자동 제공)

```
브라우저 ──HTTPS──> Vercel(정적 React)
        └──HTTPS──> Render(Express API) ──> MongoDB Atlas
```

## 1. MongoDB Atlas

1. 무료 M0 클러스터 생성
2. Database Access 에서 DB 사용자 생성
3. Network Access 에서 `0.0.0.0/0` 허용 (Render는 고정 IP 없음)
4. 연결 문자열 복사 → `MONGO_URI` 로 사용
   `mongodb+srv://<user>:<pass>@<cluster>/kanji?retryWrites=true&w=majority`

## 2. 백엔드 → Render

저장소 루트의 [`render.yaml`](../render.yaml) 블루프린트 사용.

- Render 대시보드 > **Blueprints** > 이 저장소 연결 → `kan-ji-api` 서비스 자동 생성
- 빌드: `yarn install --frozen-lockfile && yarn build` (`tsc -p tsconfig.build.json` → `dist/`)
- 실행: `yarn start` (`node dist/server.js`)
- `sync:false` 환경변수는 대시보드에서 직접 입력 (아래 표), `SESSION_SECRET`/`JWT_SECRET`은 자동 생성됨
- 배포 후 도메인: `https://kan-ji-api.onrender.com` (프론트 `REACT_APP_API_URL` 로 사용)

| 변수 | 값 |
|------|-----|
| `MONGO_URI` | Atlas 연결 문자열 |
| `ALLOWED_ORIGINS` | 프론트 도메인 (예: `https://kan-ji.vercel.app`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud 콘솔 |
| `GOOGLE_REDIRECT_URI` | `https://kan-ji.vercel.app/auth/google/callback` |
| `KAKAO_REST_API_KEY` | Kakao Developers |

전체 목록은 [`backend/.env.example`](../backend/.env.example) 참고.

## 3. 프론트 → Vercel

- Vercel 대시보드 > New Project > 이 저장소 연결
- **Root Directory 를 `frontend` 로 지정** (설정은 [`frontend/vercel.json`](../frontend/vercel.json) 에 포함, SPA 라우팅 rewrite 처리)
- 환경변수 등록 ([`frontend/.env.example`](../frontend/.env.example) 참고):

| 변수 | 값 |
|------|-----|
| `REACT_APP_API_URL` | `https://kan-ji-api.onrender.com` |
| `REACT_APP_GOOGLE_OAUTH_CLIENT_ID` | Google 클라이언트 ID |
| `REACT_APP_GOOGLE_REDIRECT_URI` | `https://kan-ji.vercel.app/auth/google/callback` |
| `REACT_APP_KAKAO_REST_API_KEY` | Kakao REST 키 |
| `REACT_APP_KAKAO_REDIRECT_URI` | `https://kan-ji.vercel.app/auth/kakao/callback` |

## 4. OAuth 콘솔 리다이렉트 등록

배포 도메인 확정 후 각 콘솔에 콜백 URL을 추가해야 로그인이 동작한다.

- **Google Cloud 콘솔** > 사용자 인증 정보 > OAuth 클라이언트
  - 승인된 JavaScript 원본: `https://kan-ji.vercel.app`
  - 승인된 리디렉션 URI: `https://kan-ji.vercel.app/auth/google/callback`
- **Kakao Developers** > 카카오 로그인 > Redirect URI: `https://kan-ji.vercel.app/auth/kakao/callback`

## 5. 배포 순서 체크리스트

1. [ ] Atlas 클러스터 + `MONGO_URI` 확보
2. [ ] Render 배포 → 백엔드 도메인 확정
3. [ ] Vercel 배포 → 프론트 도메인 확정
4. [ ] Render `ALLOWED_ORIGINS` / `*_REDIRECT_URI` 를 확정된 프론트 도메인으로 갱신 후 재배포
5. [ ] Vercel `REACT_APP_API_URL` 을 확정된 백엔드 도메인으로 갱신 후 재배포
6. [ ] Google/Kakao 콘솔에 리다이렉트 URI 등록
7. [ ] 로그인 → 학습 플로우 동작 확인

> 참고: 백엔드는 프록시 뒤에서 `secure` 쿠키를 사용하므로 `app.set("trust proxy", 1)` 이 설정되어 있다.
> Render 무료 플랜은 유휴 시 슬립되어 첫 요청이 느릴 수 있다.
