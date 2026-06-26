import { Page, Route } from '@playwright/test';

const makeDeckWord = (idx: number) => ({
  _id: `word${idx}`,
  origin_entry_id: `orig${idx}`,
  entry: `てすと${idx}`,
  pron: `テスト${idx}`,
  level: 'N5',
  step: 1,
  means: [`뜻${idx}`],
  parts: ['명사'],
  index: idx,
  isCurrent: idx === 0,
  isWindowCompleted: false,
  isBookmarked: false,
  studyStats: { tryCount: 0, correctCount: 0, successRate: 0, timeSpent: 0 },
});

export const makeDeck = (wordIds: string[], words?: ReturnType<typeof makeDeckWord>[]) => ({
  success: true,
  data: {
    deckId: 'deck1',
    level: 'N5',
    steps: { start: 1, end: 3 },
    progressType: 'main',
    words: words ?? wordIds.map((_, i) => makeDeckWord(i)),
    currentIndex: 0,
    sessionStats: {
      totalWords: wordIds.length,
      completedWords: 0,
      remainingWords: wordIds.length,
      progressPercentage: 0,
      averageWordsPerStep: 5,
      currentStep: 1,
      totalSteps: 3,
    },
    deckStatus: {
      isPassComplete: false,
      isWindowComplete: false,
      canMoveToNext: false,
      completionPercentage: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});

export const makeCompleteWordResponse = (
  passComplete: boolean,
  windowComplete: boolean,
  nextPassSize?: number,
) => ({
  success: true,
  data: {
    completion: {
      wordId: 'word0',
      isCorrect: true,
      previousAttempts: 0,
      shouldRepeat: false,
    },
    wordProgress: {
      totalAttempts: 1,
      successRate: 100,
      studyStreak: 1,
      masteryLevel: 'learning',
      recommendedAction: 'continue',
      isBookmarked: false,
    },
    currentIndex: 1,
    passComplete,
    windowComplete,
    nextPassSize,
  },
});

/**
 * 표준 3단어 덱 + 카운터 기반 completeWord 응답 목업
 *
 * 단어 3개 → 마지막 단어에서 패스 완료 신호 반환
 *
 * 주의: activeProgressType 변경으로 fetchDeck이 초기에 두 번 호출됨.
 *   callCount 기준으로 덱 응답을 결정해 두 번째 초기 GET에서도 deck3 반환.
 */
export async function setupPassCompleteFlow(page: Page) {
  const deck3 = makeDeck(['word0', 'word1', 'word2']);
  const deck1 = makeDeck(['word0'], [makeDeckWord(0)]);

  let callCount = 0;

  await page.route('**/api/users/me/progress/main/current', async (route: Route) => {
    if (callCount >= 3) {
      // 패스 완료 화면 assertion 여유를 위해 재fetch를 짧게 지연
      await new Promise<void>((r) => setTimeout(r, 300));
      route.fulfill({ json: deck1 });
    } else {
      route.fulfill({ json: deck3 });
    }
  });

  await page.route('**/api/users/me/progress/main/complete-word', (route: Route) => {
    callCount++;
    const isLast = callCount >= 3;
    route.fulfill({
      json: makeCompleteWordResponse(isLast, false, isLast ? 1 : undefined),
    });
  });
}

/**
 * 2단어 덱 + 모두 외운 경우 → 윈도우 완료 흐름
 */
export async function setupWindowCompleteFlow(page: Page) {
  const deck2 = makeDeck(['word0', 'word1']);
  let callCount = 0;

  await page.route('**/api/users/me/progress/main/current', (route: Route) => {
    route.fulfill({ json: deck2 });
  });

  await page.route('**/api/users/me/progress/main/complete-word', (route: Route) => {
    callCount++;
    const isLast = callCount >= 2;
    route.fulfill({
      json: makeCompleteWordResponse(isLast, isLast),
    });
  });
}
