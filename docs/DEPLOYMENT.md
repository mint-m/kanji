# 배포 가이드

권장 구성: **프론트 = Vercel · 백엔드 = Render · DB = MongoDB Atlas**
(OAuth 세션 쿠키가 `secure` + `sameSite=none` 이라 양쪽 모두 HTTPS 필수 → 세 서비스 모두 HTTPS 자동 제공)

```
브라우저 ──HTTPS──> Vercel(정적 React)
        └──HTTPS──> Render(Express API) ──> MongoDB Atlas
```

저장소에 이미 포함된 설정:

| 파일 | 역할 |
|------|------|
| [`render.yaml`](../render.yaml) | Render 블루프린트 (백엔드 빌드/실행/환경변수 정의) |
| [`frontend/vercel.json`](../frontend/vercel.json) | Vercel 빌드 설정 + SPA rewrite |
| [`backend/tsconfig.build.json`](../backend/tsconfig.build.json) | 프로덕션 빌드 (`yarn build` → `dist/`) |
| `backend/.env.example` / `frontend/.env.example` | 환경변수 전체 목록 |

아래는 **코드로 자동화할 수 없는, 직접 해야 하는 작업**의 상세 절차다. 순서대로 진행한다.

---

## 1. MongoDB Atlas — 데이터베이스 준비

**목표**: 프로덕션용 `MONGO_URI` 확보

1. https://cloud.mongodb.com 가입 후 Organization/Project 생성 (기본값 그대로 가능)
2. **클러스터 생성**: `Create` > **M0 (Free)** 선택
   - Provider/Region: 백엔드(Render)와 가까운 리전 선택 — Render Singapore 사용 시 AWS `ap-southeast-1`, 미국이면 `us-east-1`
   - 클러스터 이름은 자유 (예: `kanji-prod`)
3. **DB 사용자 생성**: `Security > Database Access > Add New Database User`
   - Authentication Method: Password
   - 사용자명/비밀번호 생성 — **비밀번호에 `@`, `:`, `/` 등 특수문자가 들어가면 URI에서 URL 인코딩 필요**하므로 영숫자 랜덤 문자열 권장
   - Role: `Read and write to any database` (또는 `kanji` DB 한정)
4. **네트워크 허용**: `Security > Network Access > Add IP Address`
   - `0.0.0.0/0` (Allow access from anywhere) 등록 — Render 무료 플랜은 고정 아웃바운드 IP가 없어서 필수
   - 대신 DB 사용자 비밀번호를 충분히 강하게 유지
5. **연결 문자열 복사**: 클러스터 화면 `Connect > Drivers > Node.js`
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/kanji?retryWrites=true&w=majority
   ```
   - `<password>` 치환, 호스트 뒤에 **DB 이름 `kanji`를 반드시 명시** (없으면 `test` DB에 저장됨)
6. **초기 데이터 시딩**: 프로덕션 DB는 비어 있으므로 로컬에서 Atlas를 향해 시딩
   ```bash
   cd backend
   MONGO_URI="mongodb+srv://...kanji..." yarn seed:kanji
   # 필요 시 데이터 파이프라인 스크립트도 동일한 방식으로 실행
   ```
   - 또는 `mongodump`(로컬) → `mongorestore --uri "mongodb+srv://..."`로 로컬 DB 전체 복사

---

## 2. 백엔드 → Render

**목표**: `https://kanji-api.onrender.com` 형태의 API 서버 가동

1. https://render.com 가입 후 **GitHub 계정 연동** (`mint-m/kanji` 저장소 접근 허용)
2. 대시보드 > `New > Blueprint` > 이 저장소 선택
   - 루트의 `render.yaml`을 자동 인식해 `kanji-api` 웹 서비스가 생성됨
   - 빌드/실행 명령은 블루프린트에 이미 정의됨: `yarn install --frozen-lockfile && yarn build` / `yarn start`
3. **환경변수 입력**: 블루프린트 적용 시 `sync: false` 항목은 값을 물어본다. 아래 표대로 입력:

   | 변수 | 값 | 비고 |
   |------|-----|------|
   | `MONGO_URI` | 1단계에서 확보한 Atlas URI | DB명 `kanji` 포함 확인 |
   | `ALLOWED_ORIGINS` | `https://<프론트 도메인>` | 3단계 후 확정 — 일단 예상 도메인(예: `https://kanji.vercel.app`) 입력하고 나중에 수정 가능. 콤마로 여러 개 등록 가능, **끝에 `/` 붙이지 말 것** |
   | `GOOGLE_CLIENT_ID` | Google Cloud 콘솔 값 | 4단계 참고 |
   | `GOOGLE_CLIENT_SECRET` | Google Cloud 콘솔 값 | |
   | `GOOGLE_REDIRECT_URI` | `https://<프론트 도메인>/auth/google/callback` | validateEnv 필수값. 실제 구글 교환은 팝업(postmessage) 방식이라 이 값이 구글 콘솔과 일치할 필요는 없음 |
   | `KAKAO_REST_API_KEY` | Kakao Developers 값 | 4단계 참고 |

   - `JWT_SECRET`은 `generateValue: true`로 **자동 생성됨** — 직접 입력 불필요
   - `NODE_ENV=production`, `JWT_EXPIRY=1d`도 블루프린트에 포함되어 있음
4. **배포 확인**:
   - 첫 배포 로그에서 `MongoDB connecting Success!!!` 와 `Server listening on port` 확인
   - 환경변수 누락 시 서버가 목록을 출력하고 즉시 종료하므로 로그로 바로 알 수 있음
   - 브라우저에서 `https://kanji-api.onrender.com/` 접속 → `API is running...` 응답 확인
5. 확정된 백엔드 도메인을 메모 (3단계 Vercel 환경변수에 사용)

> **무료 플랜 주의**: 15분간 요청이 없으면 슬립되어 첫 요청이 30초~1분 걸릴 수 있다. 필요하면 UptimeRobot 같은 무료 모니터링으로 주기적 핑을 걸거나 유료 플랜 전환.

---

## 3. 프론트 → Vercel

**목표**: `https://kanji.vercel.app` 형태의 정적 사이트 가동

1. https://vercel.com 가입 후 GitHub 연동 > `Add New > Project` > `kanji` 저장소 Import
2. **Root Directory를 `frontend`로 지정** — 모노레포라서 이걸 빼먹으면 빌드 실패
   - Framework Preset은 `vercel.json`의 `create-react-app` 설정을 자동 인식
   - 빌드 명령/출력 디렉터리도 `vercel.json`에 정의되어 있어 추가 설정 불필요
3. **환경변수 등록** (`Settings > Environment Variables`, Production 환경):

   | 변수 | 값 |
   |------|-----|
   | `REACT_APP_API_URL` | `https://kanji-api.onrender.com` (2단계에서 확정한 도메인, **끝에 `/` 없이**) |
   | `REACT_APP_GOOGLE_OAUTH_CLIENT_ID` | Google 클라이언트 ID (4단계) |
   | `REACT_APP_GOOGLE_REDIRECT_URI` | `https://<프론트 도메인>/auth/google/callback` |
   | `REACT_APP_KAKAO_REST_API_KEY` | Kakao REST API 키 (4단계) |
   | `REACT_APP_KAKAO_REDIRECT_URI` | `https://<프론트 도메인>/auth/kakao/callback` |

   > CRA는 환경변수를 **빌드 시점에 번들에 박아넣는다** — 값을 바꾸면 반드시 **Redeploy** 필요 (`Deployments > ⋯ > Redeploy`)
4. Deploy 실행 → 발급된 도메인 확인 (예: `https://kanji.vercel.app`)
5. **도메인 확정 후 되돌아가서 갱신**:
   - Render의 `ALLOWED_ORIGINS`, `GOOGLE_REDIRECT_URI`를 실제 프론트 도메인으로 수정 → 백엔드 자동 재배포
   - Vercel의 `REACT_APP_*_REDIRECT_URI`가 실제 도메인과 다르면 수정 후 Redeploy

---

## 4. OAuth 콘솔 등록 — 로그인 활성화

배포 도메인이 등록되지 않으면 로그인 버튼을 눌러도 콘솔별 오류(`redirect_uri_mismatch`, `origin_mismatch`, `KOE006` 등)가 난다.

### 4-1. Google Cloud 콘솔

이 앱의 구글 로그인은 **팝업(auth-code + postmessage) 방식**이다. 리디렉션이 아니라 팝업 → 코드 전달이므로 **"승인된 자바스크립트 원본"만 맞으면 된다.**

1. https://console.cloud.google.com > 기존 프로젝트 (로컬 개발에 쓰던 것 재사용 가능)
2. `API 및 서비스 > 사용자 인증 정보 > OAuth 2.0 클라이언트 ID` (웹 애플리케이션) 선택
3. **승인된 자바스크립트 원본**에 추가:
   - `https://kanji.vercel.app` (실제 프론트 도메인)
   - 기존 `http://localhost:4200`은 로컬 개발용으로 유지
4. 승인된 리디렉션 URI는 postmessage 방식에서는 사용되지 않음 — 추가 불필요
5. **OAuth 동의 화면** 확인 (`API 및 서비스 > OAuth 동의 화면`):
   - 게시 상태가 **"테스트"면 테스트 사용자 목록에 있는 계정만 로그인 가능** — 일반 공개하려면 "프로덕션으로 푸시" 필요
   - scope는 `email`, `profile`만 사용하므로 민감 범위 검증은 불필요
6. 변경 사항은 반영에 수 분~수십 분 걸릴 수 있음 (`origin_mismatch`가 계속 나면 잠시 대기)

### 4-2. Kakao Developers

카카오는 **실제 리다이렉트 방식** — 프론트의 `/auth/kakao/callback` 경로로 돌아온다.

1. https://developers.kakao.com > 내 애플리케이션 > 기존 앱 선택 (REST API 키가 `KAKAO_REST_API_KEY`)
2. **플랫폼 등록**: `앱 설정 > 플랫폼 > Web` 에 사이트 도메인 추가:
   - `https://kanji.vercel.app`
3. **Redirect URI 등록**: `제품 설정 > 카카오 로그인 > Redirect URI`:
   - `https://kanji.vercel.app/auth/kakao/callback`
   - 로컬용 `http://localhost:4200/auth/kakao/callback`과 공존 가능 (여러 개 등록 지원)
4. **카카오 로그인 활성화** 상태(ON) 확인 (`제품 설정 > 카카오 로그인`)
5. **동의 항목** 확인 (`카카오 로그인 > 동의항목`): 닉네임/프로필 등 앱이 요구하는 항목이 설정되어 있는지 확인
6. 카카오는 도메인/URI가 한 글자라도 다르면 `KOE006` 오류 — 프로토콜(`https://`)과 트레일링 슬래시까지 정확히 일치시킬 것

---

## 5. 배포 검증 — 스모크 테스트

전부 연결한 뒤 실제 브라우저에서 순서대로 확인:

1. **API 헬스**: `https://kanji-api.onrender.com/` → `API is running...`
2. **프론트 로드**: 프론트 도메인 접속 → 랜딩 페이지 렌더링
3. **SPA 라우팅**: 임의 경로(예: `/bookmarks`)로 **직접 접속 + 새로고침** → 404 없이 렌더링 (vercel.json rewrite 확인)
4. **CORS**: 개발자도구 Network 탭에서 API 요청이 CORS 오류 없이 통과하는지 — 오류 시 Render `ALLOWED_ORIGINS` 값과 실제 접속 도메인 비교
5. **Google 로그인**: 팝업 → 로그인 → 메인 페이지 진입, localStorage에 토큰 저장 확인
6. **Kakao 로그인**: 리다이렉트 → `/auth/kakao/callback` 복귀 → 로그인 완료
7. **학습 플로우**: 레벨 선택 → 덱 로드(시딩 데이터 확인) → 단어 진행 → 새로고침 후 체크포인트 복원
8. **북마크**: 토글 → 북마크 페이지에서 확인

### 자주 나는 문제

| 증상 | 원인 / 조치 |
|------|-------------|
| 로그인 직후 401, 재로그인 반복 | 백엔드 `JWT_SECRET`이 재배포마다 바뀌는 경우 기존 토큰 무효화 — Render 환경변수는 유지되므로 정상. 로컬 토큰 삭제 후 재로그인 |
| CORS 오류 | `ALLOWED_ORIGINS` 오타, 트레일링 슬래시, `http/https` 불일치 |
| 구글 `origin_mismatch` | JS 원본 미등록 또는 전파 대기 중 |
| 카카오 `KOE006` | Redirect URI 불일치 (등록값과 `REACT_APP_KAKAO_REDIRECT_URI` 비교) |
| 첫 요청 30초+ 지연 | Render 무료 플랜 슬립 — 정상 동작 |
| 데이터 없음 (빈 덱) | Atlas 시딩 누락 또는 `MONGO_URI`의 DB명이 `kanji`가 아님 |

---

## 6. 가동률 모니터 — 장애 알림 + Atlas 휴면 방지

무료 티어는 조용히 멈춘다. Render는 15분 무트래픽 시 스핀다운하고, Atlas 무료 클러스터는 30일 무접속 시 자동 일시정지된다(일시정지되면 백엔드가 기동 시 DB 연결에 실패해 종료한다).

1. 백엔드 `GET /health`는 DB 연결 상태까지 확인한다 — 연결 시 200, 끊김 시 503
2. GitHub 저장소 `Settings > Secrets and variables > Actions > Variables`에 `HEALTHCHECK_URL` = `https://<backend>.onrender.com/health` 등록
3. `.github/workflows/uptime.yml`이 6시간마다 호출한다. 실패하면 GitHub 알림 메일이 오고, 주기적 접속으로 Atlas 휴면도 막는다
   - Actions 탭에서 `Uptime` > `Run workflow`로 즉시 확인 가능
   - GitHub는 60일간 저장소 활동이 없으면 예약 워크플로를 비활성화한다 — 알림 메일이 오면 Actions 탭에서 다시 켠다

---

## 부록: 최종 체크리스트

1. [ ] Atlas 클러스터 + DB 사용자 + `0.0.0.0/0` 허용 + `MONGO_URI` 확보
2. [ ] Atlas에 단어 데이터 시딩 (`yarn seed:kanji` 등)
3. [ ] Render 블루프린트 배포 + 환경변수 입력 → 백엔드 도메인 확정
4. [ ] Vercel 프로젝트 생성 (Root Directory=`frontend`) + 환경변수 → 프론트 도메인 확정
5. [ ] Render `ALLOWED_ORIGINS`/`GOOGLE_REDIRECT_URI` 를 확정 프론트 도메인으로 갱신
6. [ ] Vercel `REACT_APP_*` 확정값 반영 후 Redeploy
7. [ ] Google 콘솔: JS 원본 등록 + 동의 화면 게시 상태 확인
8. [ ] Kakao 콘솔: Web 플랫폼 + Redirect URI 등록 + 로그인 활성화
9. [ ] 스모크 테스트 8항목 통과
10. [ ] `HEALTHCHECK_URL` 변수 등록 후 `Uptime` 워크플로 수동 실행 성공

> 참고: 백엔드는 프록시 뒤에서 `secure` 쿠키를 사용하므로 `app.set("trust proxy", 1)` 이 설정되어 있다.
