import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import { makeDeck } from '../helpers/mock-data';

const STEPS = {
  level: 'N5', totalWords: 100, totalSteps: 10,
  stepDistribution: Array.from({ length: 10 }, (_, i) => ({ _id: i + 1, wordCount: 10 })),
  availableSteps: Array.from({ length: 10 }, (_, i) => i + 1),
};

test.describe('학습 시작', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/words/level/*/steps', (route) => route.fulfill({ json: STEPS }));
    await page.route('**/api/users/me/progress/*/current', (route) => route.fulfill({ json: makeDeck(['word0']) }));
  });

  test('집중 학습으로 스텝 하나를 골라 시작하면 활성 세션이 바뀌고 카드로 간다', async ({ page }) => {
    const created: object[] = [];
    let activeType: string | null = null;
    await page.route('**/api/users/me/progress', (route) => route.fulfill({ json: { success: true, data: { sessions: [], totalSessions: 0 } } }));
    await page.route('**/api/users/me/checkpoint', (route) => {
      created.push(route.request().postDataJSON());
      route.fulfill({ json: { success: true, data: {} } });
    });
    await page.route('**/api/users/me/active-progress-type', (route) => {
      activeType = route.request().postDataJSON().activeProgressType;
      route.fulfill({ json: { success: true, data: { activeProgressType: activeType } } });
    });

    await page.goto('/start');
    await page.getByRole('radio', { name: /집중 학습/ }).click();
    await page.getByRole('radio', { name: /N5 · 입문/ }).click();
    await page.getByRole('radio', { name: /^4\s*10개$/ }).click();
    await expect(page.getByText('N5 · 스텝 4')).toBeVisible();
    await page.getByRole('button', { name: '학습 시작' }).click();

    await expect(page).toHaveURL(/\/flash-cards/);
    expect(created).toEqual([{ progressType: 'sub', level: 'N5', steps: { start: 4, end: 4 } }]);
    expect(activeType).toBe('sub');
  });

  test('진행 중인 진도 학습을 바꾸려면 동의가 필요하다', async ({ page }) => {
    let deleted = false;
    await page.route('**/api/users/me/progress', (route) => route.fulfill({
      json: {
        success: true,
        data: { sessions: [{ type: 'main', level: 'N5', steps: { start: 4, end: 6 }, window: { known: 12, total: 30 }, isPassCompleted: false }], totalSessions: 1 },
      },
    }));
    await page.route('**/api/users/me/progress/main', (route) => {
      deleted = route.request().method() === 'DELETE';
      route.fulfill({ json: { success: true } });
    });
    await page.route('**/api/users/me/checkpoint', (route) => route.fulfill({ json: { success: true, data: {} } }));

    await page.goto('/start?type=main');
    await expect(page.getByText(/익힘 12\/30\)이 이 설정으로 바뀌어요/)).toBeVisible();
    const startButton = page.getByRole('button', { name: '바꾸고 시작' });
    await expect(startButton).toBeDisabled();

    await page.getByLabel('진도 위치를 바꾸는 데 동의합니다').check();
    await startButton.click();
    await expect(page).toHaveURL(/\/flash-cards/);
    expect(deleted).toBe(true);
  });
});
