import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../store/modules';
import Home from '../pages/Main/Home';
import progressService from '../services/progressService';
import { getStats, updateActiveProgressType } from '../services/userService';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }));
jest.mock('../services/progressService', () => ({ __esModule: true, default: { getAllSessions: jest.fn() } }));
jest.mock('../services/userService', () => ({ getStats: jest.fn(), updateActiveProgressType: jest.fn() }));

const STATS = {
  learned: { total: 18, longTerm: 5 },
  levels: [],
  review: { due: 8, nextDueAt: null },
  streak: { current: 3, longest: 7, studyDays: 12 },
  today: { count: 12, goal: 20 },
  totalAnswers: 100,
};

const MAIN = {
  type: 'main', level: 'N5', steps: { start: 4, end: 6 }, window: { known: 12, total: 30 },
  sessionStats: { totalWords: 30, completedWords: 3, remainingWords: 27, progressPercentage: 10 }, isPassCompleted: false, updatedAt: '',
};

const renderHome = (activeProgressType: 'main' | 'sub' | null = 'main') => {
  const store = configureStore({ reducer: rootReducer });
  store.dispatch({ type: 'user/setUser', payload: { name: '테스터', activeProgressType } });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </Provider>
  );
};

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getStats as jest.Mock).mockResolvedValue(STATS);
    (progressService.getAllSessions as jest.Mock).mockResolvedValue({ success: true, data: { sessions: [MAIN], totalSessions: 1 } });
    (updateActiveProgressType as jest.Mock).mockResolvedValue(undefined);
  });

  it('오늘의 복습·연속 학습·오늘 학습량과 세션 위치를 보여 준다', async () => {
    renderHome();
    expect(await screen.findByText('8개')).toBeInTheDocument();
    expect(screen.getByText('🔥 연속 3일')).toBeInTheDocument();
    expect(screen.getByText(/오늘 12 \/ 20/)).toBeInTheDocument();
    expect(await screen.findByText('스텝 4–6')).toBeInTheDocument();
    expect(screen.getByText('익힘 12 / 30')).toBeInTheDocument();
    // 집중 학습은 아직 없다
    expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '복습 시작' }));
    expect(mockNavigate).toHaveBeenCalledWith('/review');
  });

  it('다른 세션을 이어 하면 활성 세션을 바꾼 뒤 카드로 간다', async () => {
    renderHome('sub');
    fireEvent.click(await screen.findByRole('button', { name: '이어하기' }));
    expect(updateActiveProgressType).toHaveBeenCalledWith('main');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/study'));
  });

  it('기록을 불러오지 못해도 학습 카드는 보여 준다', async () => {
    (getStats as jest.Mock).mockRejectedValue(new Error('down'));
    renderHome();
    expect(await screen.findByText('스텝 4–6')).toBeInTheDocument();
    expect(screen.queryByText('오늘의 복습')).not.toBeInTheDocument();
  });
});
