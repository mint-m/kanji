import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bookmarkService, { Bookmark, GetBookmarksOptions, BookmarkPagination } from 'services/bookmarkService';
import { LearningLevel, ProgressType } from 'services/types';
import { getErrorMessage } from 'services/apiClient';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import { LEVELS, levelName } from 'constants/levels';
import { clsx } from 'clsx';
import * as styles from './BookmarkPage.css';

type SortOption = 'recent' | 'level';


const LEVEL_COLORS: Record<string, string> = {
  daily: '#16a085', N5: '#e74c3c', N4: '#e67e22', N3: '#f39c12', N2: '#3498db', N1: '#9b59b6',
};

const BookmarkPage: FC = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<BookmarkPagination | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const fetchGenRef = useRef(0);

  const fetchBookmarks = useCallback(async (page: number = 1) => {
    const gen = ++fetchGenRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const options: GetBookmarksOptions = { sortBy, page, limit: 20 };
      if (selectedLevel !== 'all') options.level = selectedLevel;
      const response = await bookmarkService.getBookmarks(options);
      if (gen !== fetchGenRef.current) return;
      if (response.success && response.data) {
        const { bookmarks: list, pagination: paginationInfo } = response.data;
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
    } catch (err) {
      if (gen !== fetchGenRef.current) return;
      setBookmarks([]);
      setError(getErrorMessage(err, '북마크를 불러오는데 실패했습니다.'));
    } finally {
      if (gen === fetchGenRef.current) setIsLoading(false);
    }
  }, [selectedLevel, sortBy]);

  useEffect(() => {
    fetchBookmarks(1);
    const genRef = fetchGenRef; // ref 객체 복사 (react-hooks/exhaustive-deps: cleanup에서 .current 직접 참조 회피)
    return () => { genRef.current++; };
  }, [fetchBookmarks]);

  const handleRemoveBookmark = async (wordId: string, progressType?: string) => {
    if (!window.confirm('이 북마크를 삭제하시겠습니까?')) return;
    setActionError(null);
    try {
      const response = await bookmarkService.toggleBookmark(wordId, progressType as ProgressType);
      if (response.success) {
        const targetPage = bookmarks.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        fetchBookmarks(targetPage);
      }
    } catch (err) {
      setActionError(getErrorMessage(err, '북마크를 삭제하지 못했어요.'));
    }
  };

  const handleUpdateNotes = async (wordId: string) => {
    setActionError(null);
    try {
      const response = await bookmarkService.updateBookmarkNotes(wordId, editNotes);
      if (response.success) {
        setBookmarks(prev => prev.map(b => b.word._id === wordId ? { ...b, notes: editNotes } : b));
        setEditingBookmark(null);
        setEditNotes('');
      }
    } catch (err) {
      setActionError(getErrorMessage(err, '메모를 저장하지 못했어요.'));
    }
  };

  if (isLoading) {
    return <CenterDiv><div className="loading-text">북마크를 불러오는 중...</div></CenterDiv>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1 className={styles.pageTitle}>내 북마크</h1>
        {pagination && <span className={styles.totalCount}>{pagination.totalItems}</span>}
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="bookmark-level">레벨</label>
          <select
            id="bookmark-level"
            className={styles.filterSelect}
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as LearningLevel | 'all')}
          >
            <option value="all">전체</option>
            {LEVELS.map(l => <option key={l} value={l}>{levelName(l)}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="bookmark-sort">정렬</label>
          <select
            id="bookmark-sort"
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="recent">최근 북마크 순</option>
            <option value="level">레벨 순</option>
          </select>
        </div>
        <button
          className={styles.studyBtn}
          onClick={() => navigate('/bookmark-study', { state: { level: selectedLevel, sortBy } })}
          disabled={bookmarks.length === 0}
        >
          북마크 학습
        </button>
      </div>

      {(error || actionError) && <div className="error-box" role="alert" style={{ marginBottom: '16px' }}>{error || actionError}</div>}

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
                <span
                  className={styles.levelBadge}
                  style={{ backgroundColor: LEVEL_COLORS[bookmark.word.level] || '#95a5a6' }}
                >
                  {levelName(bookmark.word.level)}·{bookmark.word.step}
                </span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleRemoveBookmark(bookmark.word._id, bookmark.progress_type)}
                  aria-label={`${bookmark.word.pron || bookmark.word.entry} 북마크 삭제`}
                >
                  ×
                </button>
              </div>

              <div className={styles.wordArea}>
                {bookmark.word.pron ? (
                  <ruby className={styles.wordKanji}>
                    {bookmark.word.pron}
                    <rt className={styles.wordReading}>{bookmark.word.entry}</rt>
                  </ruby>
                ) : (
                  <span className={styles.wordKanji}>{bookmark.word.entry}</span>
                )}
              </div>


              <div className={styles.metaArea}>
                {bookmark.word.parts.length > 0 && (
                  <div className={styles.partsRow}>
                    {bookmark.word.parts.map((part, idx) => (
                      <span key={idx} className={styles.partTag}>{part}</span>
                    ))}
                  </div>
                )}
                <p className={styles.meanings}>{bookmark.word.means.join(', ')}</p>
              </div>

              <div className={styles.notesBox}>
                {editingBookmark === bookmark.word._id ? (
                  <>
                    <textarea
                      aria-label="메모"
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
                  <button
                    type="button"
                    className={styles.notesDisplay}
                    onClick={() => { setEditingBookmark(bookmark.word._id); setEditNotes(bookmark.notes || ''); }}
                    aria-label={`메모 수정: ${bookmark.notes}`}
                  >
                    {bookmark.notes}
                  </button>
                ) : (
                  <button
                    className={styles.addNotesBtn}
                    onClick={() => { setEditingBookmark(bookmark.word._id); setEditNotes(''); }}
                  >
                    + 메모 추가
                  </button>
                )}
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
