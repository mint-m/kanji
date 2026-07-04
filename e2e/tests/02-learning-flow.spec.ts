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

    await page.goto('/flash-cards');

    // 컨트롤 패널 버튼 4개 확인
    await expect(page.getByRole('button', { name: '한글 뜻' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: '요미가나' })).toBeVisible();
    await expect(page.getByRole('button', { name: '공부하겠습니다' })).toBeVisible();
    await expect(page.getByRole('button', { name: '외웠습니다' })).toBeVisible();
  });

  test('"한글 뜻" 버튼 클릭 시 뜻 표시', async ({ page }) => {
    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeDeck(['word0']) });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      route.fulfill({ json: makeCompleteWordResponse(false, false) });
    });

    await page.goto('/flash-cards');
    await expect(page.getByRole('button', { name: '한글 뜻' })).toBeVisible({ timeout: 10_000 });

    // "한글 뜻" 클릭 → 뜻0 표시
    await page.getByRole('button', { name: '한글 뜻' }).click();
    await expect(page.getByText('뜻0')).toBeVisible();
  });

  test('"외웠습니다" 클릭 시 다음 카드로 이동', async ({ page }) => {
    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeDeck(['word0', 'word1']) });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      route.fulfill({ json: makeCompleteWordResponse(false, false) });
    });

    await page.goto('/flash-cards');
    await expect(page.getByRole('button', { name: '한글 뜻' })).toBeVisible({ timeout: 10_000 });

    // 첫 번째 카드: 뜻0
    await assertMeanVisible(page, '뜻0');

    // 외웠습니다 → 다음 카드로 이동
    await page.getByRole('button', { name: '외웠습니다' }).click();

    // 두 번째 카드: 뜻1
    await assertMeanVisible(page, '뜻1');
  });

  test('"공부하겠습니다" 클릭 시 다음 카드로 이동', async ({ page }) => {
    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({ json: makeDeck(['word0', 'word1']) });
    });
    await page.route('**/api/users/me/progress/main/complete-word', (route) => {
      route.fulfill({ json: makeCompleteWordResponse(false, false) });
    });

    await page.goto('/flash-cards');
    await expect(page.getByRole('button', { name: '한글 뜻' })).toBeVisible({ timeout: 10_000 });

    // 첫 번째 카드 확인
    await assertMeanVisible(page, '뜻0');

    // 공부하겠습니다 → 다음 카드로 이동
    await page.getByRole('button', { name: '공부하겠습니다' }).click();

    // 두 번째 카드 확인
    await assertMeanVisible(page, '뜻1');
  });
});

test.describe('패스 완료 흐름', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('3단어 덱 - 마지막 단어 후 패스 완료 화면 표시', async ({ page }) => {
    await setupPassCompleteFlow(page);
    await page.goto('/flash-cards');

    // 컨트롤 버튼 확인 (덱 로드됨)
    await expect(page.getByRole('button', { name: '외웠습니다' })).toBeVisible({ timeout: 10_000 });

    // 3장 모두 넘기기 (마지막은 공부하겠습니다 → unknown)
    await page.getByRole('button', { name: '외웠습니다' }).click();
    await page.getByRole('button', { name: '외웠습니다' }).click();
    await page.getByRole('button', { name: '공부하겠습니다' }).click();

    // 패스 완료 화면 (API 응답 후 표시)
    await expect(page.getByText('패스 완료')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/아직 익히지 못한 1개 단어/)).toBeVisible();
  });

  test('패스 완료 후 덱 재fetch → 새 패스 시작', async ({ page }) => {
    await setupPassCompleteFlow(page);
    await page.goto('/flash-cards');

    await expect(page.getByRole('button', { name: '외웠습니다' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: '외웠습니다' }).click();
    await page.getByRole('button', { name: '외웠습니다' }).click();
    await page.getByRole('button', { name: '공부하겠습니다' }).click();

    // 패스 완료 화면 (자동 전환하지 않고 "이어가기" 버튼 대기)
    await expect(page.getByText('패스 완료')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: '이어가기' }).click();

    // 덱 재fetch + 리마운트 후 새 패스 컨트롤 버튼 다시 표시
    await expect(page.getByRole('button', { name: '외웠습니다' })).toBeVisible({ timeout: 10_000 });
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

    await page.goto('/flash-cards');
    await expect(page.getByRole('button', { name: '외웠습니다' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: '외웠습니다' }).click();    // 알았음 1
    await page.getByRole('button', { name: '공부하겠습니다' }).click(); // 몰랐음 1
    await page.getByRole('button', { name: '외웠습니다' }).click();    // 알았음 2 (마지막 → 완료 화면 진입)

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
    await page.goto('/flash-cards');

    await expect(page.getByRole('button', { name: '외웠습니다' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: '외웠습니다' }).click();
    await page.getByRole('button', { name: '외웠습니다' }).click();

    // 윈도우 완료 화면 (완료 카드에 통계 + 안내 + 버튼)
    await expect(page.getByText(/윈도우 완료/)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/다음 스텝 범위로 넘어갑니다/)).toBeVisible();
    await expect(page.getByRole('button', { name: '다음 윈도우로' })).toBeVisible();
  });

  test('"다음 윈도우로 진행" 버튼 클릭 시 덱 재fetch → 새 단어 표시', async ({ page }) => {
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
        sessionStats: { totalWords: 2, completedWords: 0, remainingWords: 2, progressPercentage: 0, averageWordsPerStep: 5, currentStep: 2, totalSteps: 3 },
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

    await page.goto('/flash-cards');
    await expect(page.getByRole('button', { name: '외웠습니다' })).toBeVisible({ timeout: 10_000 });

    // 첫 번째 윈도우 완료
    await page.getByRole('button', { name: '외웠습니다' }).click();
    await page.getByRole('button', { name: '외웠습니다' }).click();

    await expect(page.getByText(/윈도우 완료/)).toBeVisible({ timeout: 8_000 });

    // 다음 윈도우로 진행
    await page.getByRole('button', { name: '다음 윈도우로' }).click();

    // 새 덱 로드 → 컨트롤 버튼 표시
    await expect(page.getByRole('button', { name: '외웠습니다' })).toBeVisible({ timeout: 8_000 });

    // 새 윈도우 첫 번째 단어 뜻 확인
    await page.getByRole('button', { name: '한글 뜻' }).click();
    await expect(page.getByText('일본')).toBeVisible();
  });
});
