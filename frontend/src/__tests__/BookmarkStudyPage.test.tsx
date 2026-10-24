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
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '몰라요' }));
    fireEvent.click(screen.getByRole('button', { name: '알아요' }));

    expect(screen.getByText('1회차 완료')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '몰랐던 1개 다시' }));

    expect(screen.getByText('2회차')).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
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
