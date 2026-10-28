---
name: verify
description: kanji 저장소의 변경 검증 절차. 코드를 수정한 뒤 어떤 테스트를 돌리고 어떤 문서를 함께 갱신해야 하는지 판단할 때 사용한다. 학습 플로우(덱·윈도우·패스)나 API 요청·응답 형태를 건드렸을 때 특히 필요.
---

# 변경 검증

건드린 영역에 해당하는 것만 돌린다. 전부 돌릴 필요는 없다. PR을 올리면 CI가 셋 다 다시 돌린다.

| 건드린 곳 | 실행 |
|-----------|------|
| `backend/src/` | `cd backend && yarn test` |
| `frontend/src/` | `cd frontend && yarn test` |
| 학습 플로우 UI·API | 위 둘 + `yarn test:e2e` (루트에서) |
| 문서만 | 없음 |

E2E는 API mock 기반이라 백엔드·DB를 띄우지 않아도 된다 (`e2e/helpers/`). `.env`가 없으면 `PORT=4200`을 함께 준다.

## 함께 갱신해야 하는 것

- **API 응답 형태가 바뀌었다** → `frontend/src/services/types.ts`의 타입과 `docs/PROJECT_DOCS.md`의 해당 엔드포인트 표. 응답 예시 JSON은 문서에 두지 않는다 — 타입과 테스트가 단일 출처다.
- **프론트가 보내는 요청 파라미터가 바뀌었다** → 백엔드 라우트 검증(express-validator)과 맞는지 실제 라우터로 확인하는 테스트(`bookmarkRoutes.test.ts` 참고). 양쪽이 서로를 mock하면 이 계약은 아무도 확인하지 않는다.
- **새 gotcha를 발견했다** → `CLAUDE.md`의 Invariants & Gotchas. 근거는 커밋 해시보다 그 동작을 지키는 테스트 이름으로 남긴다 (스쿼시 머지하면 해시가 바뀐다).
- **엔드포인트를 추가·삭제했다** → `PROJECT_DOCS.md` API 표와 프론트 호출부(`frontend/src/services/`).

## 학습 플로우를 건드렸다면

`complete-word` / `complete-deck` / 윈도우 전환은 단위 테스트만으로는 부족하다. 다음을 확인한다 (괄호는 지키는 E2E):

- 덱 마지막 단어에서 `windowComplete: true`가 오고, 프론트가 `complete-deck`을 한 번만 호출하는지 (`윈도우 완료 흐름`)
- "모름"이 남은 패스가 재셔플되어 새 패스로 이어지는지 (`패스 완료 흐름`)
- sub 세션에서 `isSubLoop: true`로 같은 스텝이 재셔플되는지 — 다음 윈도우로 넘어가면 버그
- **완료 화면에서 이탈한 뒤 재진입해도 진행 버튼이 보이는지** — 서버는 `currentIndex = 덱 길이`로 응답한다 (`완료 화면 재진입`)
- **`complete-word`가 실패하면 조용히 넘어가지 않고 "다시 불러오기"로 복구되는지** (`진행 저장 실패`)
- 레벨의 마지막 윈도우를 마치면 완료 안내와 함께 레벨 선택으로 가는지 (`레벨 끝`)
- 북마크 복습 페이지가 실제로 단어를 불러오는지 — 조회 `limit`이 서버 상한을 넘으면 400

디프만 읽어서는 판단이 어려운 영역이다. `userCheckpoint.ts`나 `slidingWindowService.ts`를 수정했다면, 무엇이 바뀌었는지 스스로 설명할 수 있는지 점검한 뒤 머지한다.

## CI

GitHub Actions(`.github/workflows/ci.yml`)가 PR·main 푸시마다 백엔드 테스트·빌드, 프론트 테스트, E2E를 돌리고, Render는 CI가 통과한 커밋만 배포한다. 프론트 프로덕션 빌드는 Vercel 프리뷰가 확인한다 — CRA 기준 lint 위반(cleanup 함수에서 ref 직접 참조 등)이 곧 빌드 실패다. 확실하지 않으면 `cd frontend && CI=true yarn build`로 확인한다.
