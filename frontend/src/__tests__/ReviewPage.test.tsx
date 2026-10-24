import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import store from 'store';
import ReviewPage from '../pages/ReviewPage';
import reviewService from '../services/reviewService';

jest.mock('../services/reviewService', () => ({
  __esModule: true,
  default: { getDue: jest.fn(), answer: jest.fn() },
  REVIEW_INTERVAL_DAYS: [0, 1, 3, 7, 14, 30, 60],
}));

const word = (id: string, pron: string, entry: string, mean: string, stage = 1) => ({
  _id: id, origin_entry_id: id, entry, pron, level: 'N5' as const, step: 1, means: [mean], parts: [], stage, isBookmarked: false,
});

const renderPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ReviewPage />
      </MemoryRouter>
    </Provider>
  );

const showing = (kanji: string) => screen.getByRole('button', { name: `${kanji} 한자 풀이 보기` });

describe('ReviewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (reviewService.answer as jest.Mock).mockResolvedValue({ applied: true, stage: 2, nextReviewAt: '' });
  });

  it('몰라요 단어는 이번 복습 끝에 다시 나오고, 모두 알면 결과를 보여 준다', async () => {
    (reviewService.getDue as jest.Mock).mockResolvedValue({
      words: [word('a', '水', 'みず', '물'), word('b', '本', 'ほん', '책', 2)],
      dueCount: 2,
      nextDueAt: null,
    });
    renderPage();

    expect(await screen.findByText('1일 간격 복습')).toBeInTheDocument();
    expect(showing('水')).toBeInTheDocument();
    expect(screen.getByText('남은 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '알아요' }));
    expect(showing('本')).toBeInTheDocument();
    expect(screen.getByText('3일 간격 복습')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '몰라요' }));
    // 남은 단어가 本 하나뿐이라 바로 다시 나온다
    expect(showing('本')).toBeInTheDocument();
    expect(screen.getByText('남은 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '알아요' }));
    expect(await screen.findByText('복습을 마쳤어요 🎉')).toBeInTheDocument();
    // 각 통계는 숫자 + 이름 한 덩어리다
    expect(screen.getByText('한 번에 알았음')).toHaveTextContent('1한 번에 알았음');
    expect(screen.getByText('다시 익힘')).toHaveTextContent('1다시 익힘');

    expect((reviewService.answer as jest.Mock).mock.calls.map(([id, know]) => [id, know])).toEqual([
      ['a', true], ['b', false], ['b', true],
    ]);
  });

  it('복습할 단어가 없으면 다음 복습 날짜를 알려 준다', async () => {
    (reviewService.getDue as jest.Mock).mockResolvedValue({ words: [], dueCount: 0, nextDueAt: '2026-10-25T15:00:00.000Z' });
    renderPage();
    expect(await screen.findByText('지금 복습할 단어가 없어요')).toBeInTheDocument();
    expect(screen.getByText('다음 복습은 10월 26일부터 나와요.')).toBeInTheDocument();
  });

  it('응답 저장에 실패하면 알려 주되 복습은 이어간다', async () => {
    (reviewService.getDue as jest.Mock).mockResolvedValue({
      words: [word('a', '水', 'みず', '물'), word('b', '本', 'ほん', '책')],
      dueCount: 2,
      nextDueAt: null,
    });
    (reviewService.answer as jest.Mock).mockRejectedValue(new Error('network'));
    renderPage();

    await screen.findByText('남은 2');
    fireEvent.click(screen.getByRole('button', { name: '알아요' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('일부 응답을 저장하지 못했어요');
    expect(showing('本')).toBeInTheDocument();
  });
});
