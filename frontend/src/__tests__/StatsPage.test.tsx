import { render, screen } from '@testing-library/react';
import StatsPage from '../pages/StatsPage';
import { getStats } from '../services/userService';
import { UserStats } from '../services/types';

jest.mock('../services/userService', () => ({ getStats: jest.fn() }));

const STATS: UserStats = {
  learned: { total: 18, longTerm: 5 },
  levels: [
    { level: 'N5', total: 100, learned: 18, longTerm: 5 },
    { level: 'N4', total: 0, learned: 0, longTerm: 0 },
    { level: 'daily', total: 24, learned: 0, longTerm: 0 },
  ],
  review: { due: 0, nextDueAt: '2026-10-25T15:00:00.000Z' },
  streak: { current: 3, longest: 7, studyDays: 12 },
  today: { count: 8, goal: 20 },
  totalAnswers: 1234,
};

describe('StatsPage', () => {
  it('요약 타일과 단어가 있는 레벨만 보여 준다', async () => {
    (getStats as jest.Mock).mockResolvedValue(STATS);
    render(<StatsPage />);

    expect(await screen.findByText('익힌 단어')).toBeInTheDocument();
    expect(screen.getByText('장기 기억 5개')).toBeInTheDocument();
    expect(screen.getByText('목표까지 12개')).toBeInTheDocument();
    expect(screen.getByText('응답 1,234회')).toBeInTheDocument();
    // 복습 대기가 없으면 다음 복습 날짜(한국 시간)를 알려 준다
    expect(screen.getByText('다음 복습 10월 26일')).toBeInTheDocument();

    expect(screen.getByRole('progressbar', { name: /N5 익힌 단어 18개, 장기 기억 5개/ })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /일상 익힌 단어 0개/ })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: /N4/ })).not.toBeInTheDocument();
  });

  it('불러오기 실패 → 오류 안내', async () => {
    (getStats as jest.Mock).mockRejectedValue(new Error('boom'));
    render(<StatsPage />);
    expect(await screen.findByText('기록을 불러오지 못했어요.')).toBeInTheDocument();
  });
});
