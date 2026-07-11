jest.mock('../models/word', () => ({
  __esModule: true,
  default: {
    aggregate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

import Word from '../models/word';
import { SlidingWindowService } from '../services/slidingWindowService';
import { WindowConfig } from '../types/services/slidingWindow';

const CONFIG_10: WindowConfig = { windowSize: 3, maxStep: 10, minStep: 1 };
const CONFIG_5: WindowConfig = { windowSize: 3, maxStep: 5, minStep: 1 };

// DB 의존 메서드(getNextWindow, canMoveToNextWindow)는 내부적으로 maxStep을 조회한다
const mockMaxStep = (maxStep: number) => {
  (Word.aggregate as jest.Mock).mockResolvedValue([{ maxStep }]);
};

// ─── generateAllWindows ──────────────────────────────────────────────────────
describe('generateAllWindows', () => {
  it('maxStep=10, windowSize=3 → 표준 윈도우 8개 + 순환 윈도우 2개 = 10개', () => {
    const windows = SlidingWindowService.generateAllWindows('N5', CONFIG_10);
    expect(windows).toHaveLength(10);
  });

  it('표준 윈도우는 start <= end', () => {
    const windows = SlidingWindowService.generateAllWindows('N5', CONFIG_10);
    const standard = windows.filter((w) => w.start <= w.end);
    expect(standard).toHaveLength(8); // 1-3, 2-4, ..., 8-10
  });

  it('순환 윈도우는 start > end', () => {
    const windows = SlidingWindowService.generateAllWindows('N5', CONFIG_10);
    const circular = windows.filter((w) => w.start > w.end);
    expect(circular).toHaveLength(2); // 9-1, 10-2
  });

  it('첫 번째 윈도우는 {start:1, end:3}', () => {
    const [first] = SlidingWindowService.generateAllWindows('N5', CONFIG_10);
    expect(first).toEqual({ start: 1, end: 3 });
  });

  it('마지막 표준 윈도우는 {start:8, end:10}', () => {
    const windows = SlidingWindowService.generateAllWindows('N5', CONFIG_10);
    const standard = windows.filter((w) => w.start <= w.end);
    expect(standard[standard.length - 1]).toEqual({ start: 8, end: 10 });
  });

  it('maxStep=5 → 표준 3개 + 순환 2개 = 5개', () => {
    const windows = SlidingWindowService.generateAllWindows('N5', CONFIG_5);
    expect(windows).toHaveLength(5);
  });
});

// ─── isCircularWindow ────────────────────────────────────────────────────────
describe('isCircularWindow', () => {
  it('start < end → 일반 윈도우 (false)', () => {
    expect(SlidingWindowService.isCircularWindow({ start: 1, end: 3 })).toBe(false);
  });

  it('start > end → 순환 윈도우 (true)', () => {
    expect(SlidingWindowService.isCircularWindow({ start: 9, end: 1 })).toBe(true);
  });

  it('start === end → false', () => {
    expect(SlidingWindowService.isCircularWindow({ start: 5, end: 5 })).toBe(false);
  });
});

// ─── getWindowSteps ──────────────────────────────────────────────────────────
describe('getWindowSteps', () => {
  it('일반 윈도우 {1,3} → [1, 2, 3]', () => {
    expect(SlidingWindowService.getWindowSteps({ start: 1, end: 3 }, CONFIG_10)).toEqual([1, 2, 3]);
  });

  it('일반 윈도우 {5,7} → [5, 6, 7]', () => {
    expect(SlidingWindowService.getWindowSteps({ start: 5, end: 7 }, CONFIG_10)).toEqual([5, 6, 7]);
  });

  it('순환 윈도우 {9,1} → [9, 10, 1]', () => {
    expect(SlidingWindowService.getWindowSteps({ start: 9, end: 1 }, CONFIG_10)).toEqual([9, 10, 1]);
  });

  it('순환 윈도우 {10,2} → [10, 1, 2]', () => {
    expect(SlidingWindowService.getWindowSteps({ start: 10, end: 2 }, CONFIG_10)).toEqual([10, 1, 2]);
  });

  it('windowSize만큼의 스텝을 반환', () => {
    const steps = SlidingWindowService.getWindowSteps({ start: 3, end: 5 }, CONFIG_10);
    expect(steps).toHaveLength(CONFIG_10.windowSize);
  });
});

// ─── canMoveToNextWindow (DB mock) ───────────────────────────────────────────
describe('canMoveToNextWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMaxStep(10);
  });

  it('마지막 윈도우 {10,2}에서는 false', async () => {
    const result = await SlidingWindowService.canMoveToNextWindow({ start: 10, end: 2 }, 'N5');
    expect(result).toBe(false);
  });

  it('첫 번째 윈도우 {1,3}에서는 true', async () => {
    const result = await SlidingWindowService.canMoveToNextWindow({ start: 1, end: 3 }, 'N5');
    expect(result).toBe(true);
  });

  it('boolean 타입을 반환', async () => {
    const result = await SlidingWindowService.canMoveToNextWindow({ start: 1, end: 3 }, 'N5');
    expect(typeof result).toBe('boolean');
  });
});

// ─── getNextWindow (DB mock) ─────────────────────────────────────────────────
describe('getNextWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMaxStep(10);
  });

  it('{1,3} 다음은 {2,4}', async () => {
    const next = await SlidingWindowService.getNextWindow({ start: 1, end: 3 }, 'N5');
    expect(next).toEqual({ start: 2, end: 4 });
  });

  it('{8,10} 다음은 순환 윈도우 {9,1}', async () => {
    const next = await SlidingWindowService.getNextWindow({ start: 8, end: 10 }, 'N5');
    expect(next).toEqual({ start: 9, end: 1 });
  });

  it('마지막 윈도우 {10,2} 다음은 null', async () => {
    const next = await SlidingWindowService.getNextWindow({ start: 10, end: 2 }, 'N5');
    expect(next).toBeNull();
  });

  it('존재하지 않는 윈도우는 null', async () => {
    const next = await SlidingWindowService.getNextWindow({ start: 99, end: 99 }, 'N5');
    expect(next).toBeNull();
  });
});
