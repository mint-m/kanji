import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';

test.describe('홈', () => {
  test('비로그인: 서비스 소개와 로그인 버튼', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /오래 기억하는 일본어 단어장/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /카카오/ })).toBeVisible();

    // 데이터 출처(CC BY-SA 조건)는 첫 화면에서 이어지고 로그인 없이 열려야 한다.
    // 링크 클릭은 CI의 느린 dev 서버에서 30초를 넘긴 적이 있어 주소 확인 + 직접 열기로 본다
    await expect(page.getByRole('link', { name: '데이터 출처' })).toHaveAttribute('href', '/sources');
    await page.goto('/sources');
    await expect(page).toHaveURL(/\/sources$/);
    await expect(page.getByRole('heading', { name: '데이터 출처' })).toBeVisible({ timeout: 10_000 });
  });

  test('로그인: 오늘의 복습에서 복습으로, 진도 학습에서 이어하기', async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/users/me/stats', (route) => route.fulfill({
      json: {
        success: true,
        data: {
          learned: { total: 10, longTerm: 2 }, levels: [], review: { due: 4, nextDueAt: null },
          streak: { current: 2, longest: 5, studyDays: 9 }, today: { date: '2026-10-31', count: 5, goal: 20 }, totalAnswers: 50,
          activity: [{ date: '2026-10-30', count: 24 }, { date: '2026-10-31', count: 5 }],
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
    // 학습 잔디 — 최근 16주 중 이틀, 그중 하루는 목표(20장) 달성
    await expect(page.getByRole('img', { name: '최근 16주 중 2일 학습, 하루 목표 달성 1일' })).toBeVisible();

    await page.getByRole('button', { name: '복습 시작' }).click();
    await expect(page).toHaveURL(/\/review/);
  });
});
