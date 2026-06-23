import { test, expect } from '@playwright/test';
import { injectMockAuth, MOCK_USER } from '../helpers/auth';

test.describe('로그인 페이지', () => {
  test('비로그인 상태에서 /flash-cards 접근 시 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/flash-cards');
    await expect(page).toHaveURL(/\/login/);
  });

  test('로그인 페이지에 Google/Kakao 버튼 표시', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /카카오/i })).toBeVisible({ timeout: 8_000 });
  });

  test('localStorage에 유효한 토큰이 있으면 /flash-cards 접근 허용', async ({ page }) => {
    await injectMockAuth(page);

    await page.route('**/api/users/me/progress/main/current', (route) => {
      route.fulfill({
        json: {
          success: true,
          data: {
            deckId: 'deck1', level: 'N5', steps: { start: 1, end: 3 }, progressType: 'main',
            words: [], currentIndex: 0,
            sessionStats: { totalWords: 0, completedWords: 0, remainingWords: 0, progressPercentage: 0, averageWordsPerStep: 0, currentStep: 1, totalSteps: 3 },
            deckStatus: { isPassComplete: false, isWindowComplete: false, canMoveToNext: false, completionPercentage: 0 },
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          },
        },
      });
    });

    await page.goto('/flash-cards');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/flash-cards/);
  });

  test('토큰 없이 localStorage에 user만 있으면 /login으로 리다이렉트', async ({ page }) => {
    await page.addInitScript((user) => {
      localStorage.removeItem('token');
      localStorage.setItem('user', JSON.stringify(user));
    }, MOCK_USER);

    await page.goto('/flash-cards');
    await expect(page).toHaveURL(/\/login/);
  });

  test('만료된 토큰이면 /login으로 리다이렉트', async ({ page }) => {
    await page.addInitScript(() => {
      const expiredPayload = btoa(JSON.stringify({ userId: 'x', email: 'x@x.com', type: 'google', exp: 1 }));
      const token = `header.${expiredPayload}.sig`;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ _id: 'x', email: 'x@x.com', name: '유저', type: 'google', activeProgressType: 'main' }));
    });

    await page.goto('/flash-cards');
    await expect(page).toHaveURL(/\/login/);
  });
});
