---
name: verify
description: kanji 저장소의 변경 검증 절차. 코드를 수정한 뒤 어떤 테스트를 돌리고 어떤 문서를 함께 갱신해야 하는지 판단할 때 사용한다. 학습 플로우(덱·윈도우·패스)나 API 응답 형태를 건드렸을 때 특히 필요.
---

# 변경 검증

건드린 영역에 해당하는 것만 돌린다. 전부 돌릴 필요는 없다.

| 건드린 곳 | 실행 |
|-----------|------|
| `backend/src/` | `cd backend && yarn test` |
| `frontend/src/` | `cd frontend && yarn test` |
| 학습 플로우 UI·API | 위 둘 + `yarn test:e2e` (루트에서) |
| 문서만 | 없음 |

E2E는 API mock 기반이라 백엔드·DB를 띄우지 않아도 된다 (`e2e/helpers/`).

## 함께 갱신해야 하는 것

- **API 응답 형태가 바뀌었다** → `docs/PROJECT_DOCS.md`의 해당 엔드포인트 섹션. 응답 예시가 코드와 어긋나면 다음 세션이 그 예시를 믿는다.
- **새 gotcha를 발견했다** → `CLAUDE.md`의 Invariants & Gotchas. 근거 커밋 해시를 같이 남긴다 (기존 항목들이 `커밋 84d8bf8 참조` 형태로 하고 있다).
- **미사용 엔드포인트를 정리했다** → `CLAUDE.md`의 Known Limitations 목록.

## 학습 플로우를 건드렸다면

`complete-word` / `complete-deck` / 윈도우 전환은 단위 테스트만으로는 부족하다. 다음을 직접 확인한다:

- 덱 마지막 단어에서 `windowComplete: true`가 오고, 프론트가 `complete-deck`을 한 번만 호출하는지
- "모름"이 남은 패스가 재셔플되어 새 패스로 이어지는지
- sub 세션에서 `isSubLoop: true`로 같은 스텝이 재셔플되는지 (다음 윈도우로 넘어가면 버그)

디프만 읽어서는 판단이 어려운 영역이다. `userCheckpoint.ts`나 `slidingWindowService.ts`를 수정했다면, 무엇이 바뀌었는지 스스로 설명할 수 있는지 점검한 뒤 머지한다.

## CI

프론트 빌드는 CRA 기준으로 엄격하다. lint 위반(cleanup 함수에서 ref 직접 참조 등)이 곧 빌드 실패다 — 로컬 `yarn test` 통과가 CI 통과를 보장하지 않는다. 확실하지 않으면 `cd frontend && yarn build`로 확인한다.
