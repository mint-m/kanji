import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import { setupPassCompleteFlow, setupWindowCompleteFlow, makeDeck, makeCompleteWordResponse } from '../helpers/mock-data';

// 뜻 텍스트로 카드를 확인: 한글 뜻 버튼 클릭 후 meanItem이 보임
async function assertMeanVisible(page: import('@playwright/test').Page, mean: string) {
  await page.getByRole('button', { name: '한글 뜻' }).click();
  await expect(page.getByText(mean)).toBeVisible();
}

test.describe('학습 플로우 - 플래시카드', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('덱 로드 후 컨트롤 버튼 표시', async ({ page }) => {
    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeDeck(['word0', 'word1']) });
    });

    await page.goto('/study');

    // 컨트롤 패널 버튼 4개 확인
    await expect(page.getByRole('button', { name: '한글 뜻' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: '요미가나' })).toBeVisible();
    await expect(page.getByRole('button', { name: '몰라요' })).toBeVisible();
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible();
  });

  test('"한글 뜻" 버튼 클릭 시 뜻 표시', async ({ page }) => {
    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeDeck(['word0']) });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      route.fulfill({ json: makeCompleteWordResponse(false, false) });
    });

    await page.goto('/study');
    await expect(page.getByRole('button', { name: '한글 뜻' })).toBeVisible({ timeout: 10_000 });

    // "한글 뜻" 클릭 → 뜻0 표시
    await page.getByRole('button', { name: '한글 뜻' }).click();
    await expect(page.getByText('뜻0')).toBeVisible();
  });

  test('"알아요" 클릭 시 다음 카드로 이동', async ({ page }) => {
    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeDeck(['word0', 'word1']) });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      route.fulfill({ json: makeCompleteWordResponse(false, false) });
    });

    await page.goto('/study');
    await expect(page.getByRole('button', { name: '한글 뜻' })).toBeVisible({ timeout: 10_000 });

    // 첫 번째 카드: 뜻0
    await assertMeanVisible(page, '뜻0');

    // 알아요 → 다음 카드로 이동
    await page.getByRole('button', { name: '알아요' }).click();

    // 두 번째 카드: 뜻1
    await assertMeanVisible(page, '뜻1');
  });

  test('"몰라요" 클릭 시 다음 카드로 이동', async ({ page }) => {
    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeDeck(['word0', 'word1']) });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      route.fulfill({ json: makeCompleteWordResponse(false, false) });
    });

    await page.goto('/study');
    await expect(page.getByRole('button', { name: '한글 뜻' })).toBeVisible({ timeout: 10_000 });

    // 첫 번째 카드 확인
    await assertMeanVisible(page, '뜻0');

    // 몰라요 → 다음 카드로 이동
    await page.getByRole('button', { name: '몰라요' }).click();

    // 두 번째 카드 확인
    await assertMeanVisible(page, '뜻1');
  });
});

test.describe('키보드로 학습', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('Space로 요미가나 → 뜻 하나씩 공개, →로 알아요, ←로 몰라요', async ({ page }) => {
    const answers: boolean[] = [];
    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeDeck(['word0', 'word1', 'word2']) });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      answers.push(route.request().postDataJSON().isCorrect);
      route.fulfill({ json: makeCompleteWordResponse(false, false) });
    });

    await page.goto('/study');
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('뜻0')).toBeHidden();
    await page.keyboard.press('Space');
    await expect(page.getByText('てすと0')).toBeVisible();
    await expect(page.getByText('뜻0')).toBeHidden();
    await page.keyboard.press('Space');
    await expect(page.getByText('뜻0')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await expect(page.getByText('뜻1')).toBeVisible();
    await page.keyboard.press('ArrowLeft');

    await expect.poll(() => answers).toEqual([true, false]);
  });
});

test.describe('패스 완료 흐름', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('3단어 덱 - 마지막 단어 후 패스 완료 화면 표시', async ({ page }) => {
    await setupPassCompleteFlow(page);
    await page.goto('/study');

    // 컨트롤 버튼 확인 (덱 로드됨)
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });

    // 3장 모두 넘기기 (마지막은 몰라요 → unknown)
    await page.getByRole('button', { name: '알아요' }).click();
    await page.getByRole('button', { name: '알아요' }).click();
    await page.getByRole('button', { name: '몰라요' }).click();

    // 패스 완료 화면 (API 응답 후 표시)
    await expect(page.getByText('한 바퀴 완료')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/아직 익히지 못한 1개 단어/)).toBeVisible();
  });

  test('패스 완료 후 덱 재fetch → 새 패스 시작', async ({ page }) => {
    await setupPassCompleteFlow(page);
    await page.goto('/study');

    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: '알아요' }).click();
    await page.getByRole('button', { name: '알아요' }).click();
    await page.getByRole('button', { name: '몰라요' }).click();

    // 패스 완료 화면 (자동 전환하지 않고 "이어가기" 버튼 대기)
    await expect(page.getByText('한 바퀴 완료')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: '이어가기' }).click();

    // 덱 재fetch + 리마운트 후 새 패스 컨트롤 버튼 다시 표시
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });
  });

  test('통계 행 - 알았음/몰랐음 카운트 표시', async ({ page }) => {
    const deck = makeDeck(['word0', 'word1', 'word2']);

    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: deck });
    });
    // passComplete=false로 고정 → onPassComplete 미호출 → 완료 화면 유지
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      route.fulfill({ json: makeCompleteWordResponse(false, false) });
    });

    await page.goto('/study');
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: '알아요' }).click(); // 알았음 1
    await page.getByRole('button', { name: '몰라요' }).click(); // 몰랐음 1
    await page.getByRole('button', { name: '알아요' }).click(); // 알았음 2 (마지막 → 완료 화면 진입)

    // passComplete=false이므로 "처리 중..." 완료 화면이 유지됨 → 통계 레이블 확인 가능
    await expect(page.getByText('알았음')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('몰랐음')).toBeVisible();

    // 숫자(통계) 클릭 시 해당 단어 목록 펼침
    await page.getByRole('button', { name: /알았음/ }).click();
    await expect(page.getByText('テスト0')).toBeVisible();
    await expect(page.getByText('テスト2')).toBeVisible();

    // 몰랐음 클릭 시 목록 전환
    await page.getByRole('button', { name: /몰랐음/ }).click();
    await expect(page.getByText('テスト1')).toBeVisible();
  });
});

test.describe('윈도우 완료 흐름', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('2단어 모두 외우면 윈도우 완료 화면 표시', async ({ page }) => {
    await setupWindowCompleteFlow(page);
    await page.goto('/study');

    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: '알아요' }).click();
    await page.getByRole('button', { name: '알아요' }).click();

    // 윈도우 완료 화면 (완료 카드에 통계 + 안내 + 버튼)
    await expect(page.getByText(/이 범위를 모두 익혔어요/)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/다음 범위로 넘어갑니다/)).toBeVisible();
    await expect(page.getByRole('button', { name: '다음 범위로' })).toBeVisible();
  });

  test('"다음 범위로" 버튼 클릭 시 덱 재fetch → 새 단어 표시', async ({ page }) => {
    const deck2 = makeDeck(['word0', 'word1']);
    // 다음 윈도우: 뜻이 다른 두 단어
    const nextDeck = {
      success: true,
      data: {
        deckId: 'deck2', level: 'N5', steps: { start: 2, end: 4 }, progressType: 'main',
        words: [
          { _id: 'next0', origin_entry_id: 'norig0', entry: 'にほん', pron: 'にほん', level: 'N5', step: 2, means: ['일본'], parts: ['명사'], index: 0, isCurrent: true, isWindowCompleted: false, isBookmarked: false },
          { _id: 'next1', origin_entry_id: 'norig1', entry: 'がっこう', pron: 'がっこう', level: 'N5', step: 2, means: ['학교'], parts: ['명사'], index: 1, isCurrent: false, isWindowCompleted: false, isBookmarked: false },
        ],
        currentIndex: 0,
        sessionStats: { totalWords: 2, completedWords: 0, remainingWords: 2, progressPercentage: 0 },
        window: { total: 2, known: 0 },
        deckStatus: { isPassComplete: false, isWindowComplete: false, canMoveToNext: false, completionPercentage: 0 },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    };

    let deckCallCount = 0;
    let completeCount = 0;

    await page.route('**/api/users/me/progress/main/current', (route) => {
      deckCallCount++;
      route.fulfill({ json: deckCallCount === 1 ? deck2 : nextDeck });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      completeCount++;
      route.fulfill({ json: makeCompleteWordResponse(completeCount >= 2, completeCount >= 2) });
    });
    await page.route('**/api/users/me/progress/main/complete-deck', (route) => {
      route.fulfill({
        json: {
          success: true,
          data: {
            nextWindow: { level: 'N5', steps: { start: 2, end: 4 }, deckSize: 2 },
            canGenerateNext: true,
            isSubLoop: false,
          },
        },
      });
    });

    await page.goto('/study');
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });

    // 첫 번째 윈도우 완료
    await page.getByRole('button', { name: '알아요' }).click();
    await page.getByRole('button', { name: '알아요' }).click();

    await expect(page.getByText(/이 범위를 모두 익혔어요/)).toBeVisible({ timeout: 8_000 });

    // 다음 범위로 진행
    await page.getByRole('button', { name: '다음 범위로' }).click();

    // 새 덱 로드 → 컨트롤 버튼 표시
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 8_000 });

    // 새 윈도우 첫 번째 단어 뜻 확인
    await page.getByRole('button', { name: '한글 뜻' }).click();
    await expect(page.getByText('일본')).toBeVisible();
  });
});

test.describe('완료 화면 재진입', () => {
  // 완료 화면에서 이탈하면 complete-deck 없이 세션이 남는다 → 서버는 currentIndex = 덱 길이로 응답한다
  const makeCompletedDeck = (progressType: 'main' | 'sub') => {
    const deck = makeDeck(['word0', 'word1']);
    deck.data.progressType = progressType;
    deck.data.currentIndex = 2;
    deck.data.deckStatus = {
      isPassComplete: true,
      isWindowComplete: true,
      canMoveToNext: progressType === 'main',
      completionPercentage: 100,
    };
    return deck;
  };

  test('메인: "다음 범위로" 버튼이 보이고 누르면 complete-deck 호출', async ({ page }) => {
    await injectMockAuth(page);
    let completeDeckCalled = false;

    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeCompletedDeck('main') });
    });
    await page.route('**/api/users/me/progress/main/complete-deck', (route) => {
      completeDeckCalled = true;
      route.fulfill({
        json: {
          success: true,
          data: { nextWindow: { level: 'N5', steps: { start: 2, end: 4 }, deckSize: 2 }, canGenerateNext: true, isSubLoop: false },
        },
      });
    });

    await page.goto('/study');

    await expect(page.getByText(/이 범위를 모두 익혔어요/)).toBeVisible({ timeout: 10_000 });
    // 이번 화면에서 답한 기록이 없으므로 0/0 통계는 표시하지 않는다
    await expect(page.getByRole('button', { name: /알았음/ })).toHaveCount(0);

    await page.getByRole('button', { name: '다음 범위로' }).click();
    await expect.poll(() => completeDeckCalled).toBe(true);
  });

  test('서브: "다시 학습하기"와 "홈으로" 버튼 표시', async ({ page }) => {
    await injectMockAuth(page, { activeProgressType: 'sub' });

    await page.route('**/api/users/me/progress/sub/current', (route) => {
      route.fulfill({ json: makeCompletedDeck('sub') });
    });

    await page.goto('/study');

    await expect(page.getByText(/이 스텝을 모두 익혔어요/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: '다시 학습하기' })).toBeVisible();
    // 상단 로고 링크(aria-label 'kanji 홈으로')와 구분하도록 버튼 텍스트로 찾는다
    await expect(page.getByRole('button').getByText('홈으로', { exact: true })).toBeVisible();
  });
});

test.describe('진행 저장 실패', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('complete-word 실패 시 복구 화면 → "다시 불러오기"로 덱 재조회', async ({ page }) => {
    let deckCallCount = 0;
    const sentIndexes: number[] = [];

    await page.route('**/api/users/me/progress/main/current', (route) => {
      deckCallCount++;
      route.fulfill({ json: makeDeck(['word0', 'word1', 'word2']) });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      sentIndexes.push(route.request().postDataJSON().index);
      route.fulfill({ status: 500, json: { success: false, message: 'Failed to complete word' } });
    });

    await page.goto('/study');
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: '알아요' }).click();

    // 조용히 넘어가지 않고 복구 화면을 보여준다
    await expect(page.getByText('진행 상황을 저장하지 못했어요')).toBeVisible({ timeout: 8_000 });
    expect(sentIndexes).toEqual([0]); // 답한 카드 위치를 함께 보낸다

    const callsBefore = deckCallCount;
    await page.getByRole('button', { name: '다시 불러오기' }).click();

    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 8_000 });
    expect(deckCallCount).toBeGreaterThan(callsBefore);
  });
});

test.describe('서버 콜드 스타트', () => {
  test('덱 로딩이 5초를 넘기면 서버를 깨우는 중이라는 안내 표시', async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/users/me/progress/main/current', async (route) => {
      await new Promise<void>((r) => setTimeout(r, 7_000));
      route.fulfill({ json: makeDeck(['word0']) });
    });

    await page.goto('/study');

    await expect(page.getByText(/서버를 깨우는 중/)).toBeVisible({ timeout: 6_500 });
    // 응답이 오면 안내는 사라지고 카드가 표시된다
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/서버를 깨우는 중/)).toHaveCount(0);
  });
});

test.describe('레벨 끝', () => {
  test('마지막 범위 완료 → 학습 시작 화면에 완료 안내, 다음 레벨 선택, 바꾸기 동의 없이 시작 가능', async ({ page }) => {
    await injectMockAuth(page);
    let completeCount = 0;

    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeDeck(['word0']) });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      completeCount++;
      route.fulfill({ json: makeCompleteWordResponse(true, true) });
    });
    await page.route('**/api/users/me/progress/main/complete-deck', (route) => {
      route.fulfill({ json: { success: true, data: { nextWindow: null, canGenerateNext: false, isSubLoop: false } } });
    });
    // 학습 시작 화면이 조회하는 기존 세션(모두 익힌 상태)과 레벨 스텝 구성
    await page.route('**/api/users/me/progress', (route) => {
      route.fulfill({
        json: {
          success: true,
          data: {
            sessions: [{ type: 'main', level: 'N5', steps: { start: 10, end: 2 }, window: { known: 1, total: 1 }, isPassCompleted: true }],
            totalSessions: 1,
          },
        },
      });
    });
    await page.route('**/api/words/level/*/steps', (route) => {
      route.fulfill({
        json: {
          level: 'N4', totalWords: 100, totalSteps: 10,
          stepDistribution: Array.from({ length: 10 }, (_, i) => ({ _id: i + 1, wordCount: 10 })),
          availableSteps: Array.from({ length: 10 }, (_, i) => i + 1),
        },
      });
    });

    await page.goto('/study');
    await expect(page.getByRole('button', { name: '알아요' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: '알아요' }).click();

    await page.getByRole('button', { name: '다음 범위로' }).click();

    await expect(page).toHaveURL(/\/start/);
    await expect(page.getByText(/마지막 범위까지 모두 익혔어요/)).toBeVisible();
    // 다음 레벨(N4)이 미리 골라져 있다
    await expect(page.getByRole('radio', { name: /N4 · 초급/ })).toHaveAttribute('aria-checked', 'true');
    // 다 마친 진도는 잃을 것이 없으므로 바꾸기 동의를 묻지 않는다
    await expect(page.getByText(/이 설정으로 바뀌어요/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: '학습 시작' })).toBeEnabled();
    expect(completeCount).toBe(1);
  });
});
