import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';

test.describe('홈', () => {
  test('비로그인: 서비스 소개와 로그인 버튼', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /오래 기억하는 일본어 단어장/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /카카오/ })).toBeVisible();
  });

  test('로그인: 오늘의 복습에서 복습으로, 진도 학습에서 이어하기', async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/users/me/stats', (route) => route.fulfill({
      json: {
        success: true,
        data: {
          learned: { total: 10, longTerm: 2 }, levels: [], review: { due: 4, nextDueAt: null },
          streak: { current: 2, longest: 5, studyDays: 9 }, today: { count: 5, goal: 20 }, totalAnswers: 50,
        },
      },
    }));
    await page.route('**/api/users/me/progress', (route) => route.fulfill({
      json: {
        success: true,
        data: { sessions: [{ type: 'main', level: 'N5', steps: { start: 2, end: 4 }, window: { known: 7, total: 30 }, isPassCompleted: false }], totalSessions: 1 },
      },
    }));
    await page.route('**/api/users/me/reviews/due**', (route) => route.fulfill({
      json: { success: true, data: { words: [], dueCount: 0, nextDueAt: null } },
    }));

    await page.goto('/');
    await expect(page.getByText('익힘 7 / 30')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('🔥 연속 2일')).toBeVisible();

    await page.getByRole('button', { name: '복습 시작' }).click();
    await expect(page).toHaveURL(/\/review/);
  });
});
