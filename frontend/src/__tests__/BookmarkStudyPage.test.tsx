import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import store from 'store';
import BookmarkStudyPage from '../pages/BookmarkStudyPage';
import bookmarkService from '../services/bookmarkService';

jest.mock('../services/bookmarkService', () => ({
  __esModule: true,
  default: { getBookmarks: jest.fn(), toggleBookmark: jest.fn() },
}));
// 카드 공개 순서 설정을 서버에 묻지 않는다
jest.mock('../hooks/useRevealFirst', () => ({ useRevealFirst: () => 'reading' }));

const bookmark = (id: string, pron: string, entry: string) => ({
  _id: `b-${id}`, user_id: 'u', word_id: id, progress_type: 'main', is_bookmarked: true, bookmarked_at: '',
  word: { _id: id, origin_entry_id: id, entry, pron, level: 'N5', step: 1, means: ['뜻'], parts: [] },
});

const renderPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <BookmarkStudyPage />
      </MemoryRouter>
    </Provider>
  );

describe('BookmarkStudyPage', () => {
  it('몰랐던 단어만 다음 회차로, 모두 알면 끝', async () => {
    (bookmarkService.getBookmarks as jest.Mock).mockResolvedValue({
      success: true,
      data: { bookmarks: [bookmark('a', '水', 'みず'), bookmark('b', '本', 'ほん')], pagination: {} },
    });
    renderPage();

    expect(await screen.findByText('1회차')).toBeInTheDocument();
    expect(screen.getByText('0 / 2')).toBeInTheDocument();
    expect(screen.getByText('남음 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '몰라요' }));
    // 몰랐던 카드는 연한 칸으로 남고, 안 단어 수는 그대로
    expect(screen.getByText('0 / 2')).toBeInTheDocument();
    expect(screen.getByText('남음 1')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '이번 회차에서 안 단어' })).toHaveAttribute('aria-valuetext', '0 / 2, 남음 1');
    fireEvent.click(screen.getByRole('button', { name: '알아요' }));

    expect(screen.getByText('1회차 완료')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '몰랐던 1개 다시' }));

    expect(screen.getByText('2회차')).toBeInTheDocument();
    expect(screen.getByText('0 / 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '알아요' }));

    expect(screen.getByText('북마크 단어를 모두 알았어요 🎉')).toBeInTheDocument();
    // 복습 조회는 서버 상한(150)과 같은 limit으로 한 번에
    expect(bookmarkService.getBookmarks).toHaveBeenCalledWith(expect.objectContaining({ limit: 150 }));
  });

  it('북마크가 없으면 모으는 방법을 알려 준다', async () => {
    (bookmarkService.getBookmarks as jest.Mock).mockResolvedValue({ success: true, data: { bookmarks: [], pagination: {} } });
    renderPage();
    expect(await screen.findByText(/북마크한 단어가 없어요/)).toBeInTheDocument();
  });
});
