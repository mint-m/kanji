import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';

const reviewWord = (idx: number, stage: number) => ({
  _id: `rw${idx}`,
  origin_entry_id: `rorig${idx}`,
  entry: `ふくしゅう${idx}`,
  pron: `復習${idx}`,
  level: 'N5',
  step: 1,
  means: [`복습뜻${idx}`],
  parts: ['명사'],
  stage,
  isBookmarked: false,
});

test.describe('오늘의 복습', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('몰라요 단어는 끝에 다시 나오고, 모두 알면 결과 화면', async ({ page }) => {
    const answers: { wordId: string; isCorrect: boolean }[] = [];
    await page.route('**/api/users/me/reviews/due**', (route) => {
      route.fulfill({ json: { success: true, data: { words: [reviewWord(0, 1), reviewWord(1, 3)], dueCount: 2, nextDueAt: null } } });
    });
    await page.route('**/api/users/me/reviews/answer', (route) => {
      const { wordId, isCorrect } = route.request().postDataJSON();
      answers.push({ wordId, isCorrect });
      route.fulfill({ json: { success: true, data: { applied: true, stage: isCorrect ? 2 : 0, nextReviewAt: new Date().toISOString() } } });
    });

    await page.goto('/review');
    await expect(page.getByText('1일 간격 복습')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: '알아요' }).click();
    await expect(page.getByText('7일 간격 복습')).toBeVisible();
    await page.getByRole('button', { name: '몰라요' }).click();
    // 하나 남은 단어가 다시 나온다 — 끝낸 수는 그대로
    await expect(page.getByText('1 / 2')).toBeVisible();
    await page.keyboard.press('ArrowRight');

    await expect(page.getByText('복습을 마쳤어요 🎉')).toBeVisible();
    await expect.poll(() => answers).toEqual([
      { wordId: 'rw0', isCorrect: true },
      { wordId: 'rw1', isCorrect: false },
      { wordId: 'rw1', isCorrect: true },
    ]);
  });

  test('복습할 단어가 없으면 안내와 학습하러 가기', async ({ page }) => {
    await page.route('**/api/users/me/reviews/due**', (route) => {
      route.fulfill({ json: { success: true, data: { words: [], dueCount: 0, nextDueAt: null } } });
    });

    await page.goto('/review');
    await expect(page.getByText('지금 복습할 단어가 없어요')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: '학습하러 가기' })).toBeVisible();
  });
});
