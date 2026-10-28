import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';

const bookmark = (idx: number, level = 'N5') => ({
  _id: `bm${idx}`, user_id: 'u', word_id: `bw${idx}`, progress_type: 'main', is_bookmarked: true, bookmarked_at: new Date().toISOString(),
  word: { _id: `bw${idx}`, origin_entry_id: `bo${idx}`, entry: `ぶっく${idx}`, pron: `北${idx}`, level, step: 1, means: [`북뜻${idx}`], parts: ['명사'] },
});

test.describe('북마크', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('목록 → 북마크 학습: 몰랐던 단어만 다음 회차로', async ({ page }) => {
    const queries: string[] = [];
    await page.route('**/api/users/me/bookmarks?**', (route) => {
      queries.push(new URL(route.request().url()).search);
      route.fulfill({
        json: {
          success: true,
          data: { bookmarks: [bookmark(0), bookmark(1, 'daily')], pagination: { currentPage: 1, itemsPerPage: 20, totalItems: 2, totalPages: 1 } },
        },
      });
    });

    await page.goto('/bookmarks');
    // daily 레벨도 이름(일상)으로 보이고 필터에 있다
    await expect(page.getByText('일상·1')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel('레벨').locator('option', { hasText: '일상' })).toHaveCount(1);

    await page.getByRole('button', { name: '북마크 학습' }).click();
    await expect(page).toHaveURL(/\/bookmarks\/study$/);
    await expect(page.getByText('1회차')).toBeVisible();

    await page.getByRole('button', { name: '몰라요' }).click();
    await page.getByRole('button', { name: '알아요' }).click();
    await page.getByRole('button', { name: '몰랐던 1개 다시' }).click();
    await expect(page.getByText('2회차')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('북마크 단어를 모두 알았어요 🎉')).toBeVisible();

    // 북마크 학습은 서버 상한(150)으로 한 번에, 최근 북마크 순으로 조회한다
    expect(queries.some((q) => q.includes('limit=150') && q.includes('sortBy=bookmarked_at'))).toBe(true);
  });
});
