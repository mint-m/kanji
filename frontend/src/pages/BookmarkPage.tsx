import { FC, useEffect, useState } from 'react';
import bookmarkService, { Bookmark, GetBookmarksOptions } from 'services/bookmarkService';
import { LearningLevel } from 'services/types';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import { clsx } from 'clsx';
import * as styles from './BookmarkPage.css';

interface BookmarkStats {
  totalBookmarks: number;
  completedBookmarks: number;
}

type SortOption = 'recent' | 'level';

const LEVEL_COLORS: Record<string, string> = {
  N5: '#e74c3c', N4: '#e67e22', N3: '#f39c12', N2: '#3498db', N1: '#9b59b6',
};

const BookmarkPage: FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ currentPage: number; itemsPerPage: number; totalItems: number; totalPages: number } | null>(null);
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const fetchBookmarks = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const options: GetBookmarksOptions = { sortBy, page, limit: 20 };
      if (selectedLevel !== 'all') options.level = selectedLevel;
      const response = await bookmarkService.getBookmarks(options);
      if (response.success && response.data) {
        const { bookmarks: list, pagination: paginationInfo } = response.data as any;
        if (Array.isArray(list)) {
          setBookmarks(list);
          setPagination(paginationInfo);
          setCurrentPage(page);
        } else {
          setBookmarks([]);
          setError('북마크를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        setBookmarks([]);
        setError('북마크를 불러오는데 실패했습니다.');
      }
    } catch {
      setBookmarks([]);
      setError('북마크를 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await bookmarkService.getBookmarkStats();
      if (response.success && response.data) setStats(response.data);
    } catch {}
  };

  useEffect(() => { fetchBookmarks(1); }, [selectedLevel, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStats(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemoveBookmark = async (wordId: string) => {
    if (!window.confirm('이 북마크를 삭제하시겠습니까?')) return;
    try {
      const response = await bookmarkService.removeBookmark(wordId);
      if (response.success) {
        setBookmarks(prev => prev.filter(b => b.word._id !== wordId));
        fetchStats();
      }
    } catch {
      alert('북마크 삭제에 실패했습니다.');
    }
  };

  const handleUpdateNotes = async (wordId: string) => {
    try {
      const response = await bookmarkService.updateBookmarkNotes(wordId, editNotes);
      if (response.success) {
        setBookmarks(prev => prev.map(b => b.word._id === wordId ? { ...b, notes: editNotes } : b));
        setEditingBookmark(null);
        setEditNotes('');
      }
    } catch {
      alert('메모 업데이트에 실패했습니다.');
    }
  };

  if (isLoading) {
    return <CenterDiv><div className="loading-text">북마크를 불러오는 중...</div></CenterDiv>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>내 북마크</h1>

      {stats && (
        <div className={styles.statsGrid}>
          {[
            { label: '총 북마크', value: stats.totalBookmarks || 0 },
            { label: '완료한 단어', value: stats.completedBookmarks || 0 },
            { label: '완료율', value: `${stats.totalBookmarks > 0 ? Math.round((stats.completedBookmarks / stats.totalBookmarks) * 100) : 0}%` },
          ].map(({ label, value }) => (
            <div key={label} className={clsx('card', styles.statCard)}>
              <div className={styles.statLabel}>{label}</div>
              <div className={styles.statValue}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className={clsx('card', styles.filtersBar)}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>레벨 필터:</label>
          <select
            className="filter-select"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as LearningLevel | 'all')}
          >
            <option value="all">전체</option>
            {['N5','N4','N3','N2','N1'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>정렬:</label>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="recent">최근 순</option>
            <option value="level">레벨 순</option>
            <option value="step">단계 순</option>
          </select>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '16px' }}>{error}</div>}

      {bookmarks.length === 0 ? (
        <div className={clsx('card', styles.emptyCard)}>
          <h2 className={styles.emptyTitle}>북마크가 없습니다</h2>
          <p className={styles.emptyDesc}>학습 중 어려운 단어를 북마크로 저장하세요.</p>
        </div>
      ) : (
        <div className={styles.bookmarkList}>
          {bookmarks.map((bookmark) => (
            <div key={bookmark._id} className={clsx('card', styles.bookmarkCard)}>
              <div className={styles.bookmarkHeader}>
                <div className={styles.wordMain}>
                  <div className={styles.wordPron}>{bookmark.word.pron || bookmark.word.entry}</div>
                  <div className={styles.wordEntry}>{bookmark.word.entry}</div>
                </div>
                <span
                  className={styles.levelBadge}
                  style={{ backgroundColor: LEVEL_COLORS[bookmark.word.level] || '#95a5a6' }}
                >
                  {bookmark.word.level} - Step {bookmark.word.step}
                </span>
              </div>

              <div className={styles.meanings}>
                {bookmark.word.means.map((meaning, idx) => (
                  <div key={idx} className={styles.meaningItem}>{meaning}</div>
                ))}
              </div>

              <div className={styles.partsRow}>
                {bookmark.word.parts.map((part, idx) => (
                  <span key={idx} className={styles.partTag}>{part}</span>
                ))}
              </div>

              <div className={styles.notesBox}>
                {editingBookmark === bookmark.word._id ? (
                  <>
                    <textarea
                      className={styles.notesTextarea}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="메모를 입력하세요..."
                    />
                    <div className={styles.notesActions}>
                      <button className={styles.saveBtn} onClick={() => handleUpdateNotes(bookmark.word._id)}>저장</button>
                      <button className={styles.cancelBtn} onClick={() => { setEditingBookmark(null); setEditNotes(''); }}>취소</button>
                    </div>
                  </>
                ) : bookmark.notes ? (
                  <div
                    className={styles.notesDisplay}
                    onClick={() => { setEditingBookmark(bookmark.word._id); setEditNotes(bookmark.notes || ''); }}
                  >
                    {bookmark.notes}
                  </div>
                ) : (
                  <button
                    className={styles.addNotesBtn}
                    onClick={() => { setEditingBookmark(bookmark.word._id); setEditNotes(''); }}
                  >
                    + 메모 추가
                  </button>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.dateText}>{new Date(bookmark.bookmarked_at).toLocaleDateString('ko-KR')}</span>
                <button className={styles.deleteBtn} onClick={() => handleRemoveBookmark(bookmark.word._id)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button className="page-btn" onClick={() => fetchBookmarks(currentPage - 1)} disabled={currentPage === 1}>이전</button>
          <div className={styles.paginationInfo}>
            {currentPage} / {pagination.totalPages} 페이지
            <span className={styles.paginationSub}>(총 {pagination.totalItems}개)</span>
          </div>
          <button className="page-btn" onClick={() => fetchBookmarks(currentPage + 1)} disabled={currentPage === pagination.totalPages}>다음</button>
        </div>
      )}
    </div>
  );
};

export default BookmarkPage;
