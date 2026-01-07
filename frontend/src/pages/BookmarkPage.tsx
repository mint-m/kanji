import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import bookmarkService, { Bookmark, GetBookmarksOptions } from 'services/bookmarkService';
import { LearningLevel } from 'services/types';
import CenterDiv from 'components/CommonStyled/CenterDiv';

interface BookmarkPageProps { }
interface BookmarkStats {
  totalBookmarks: number;
  completedBookmarks: number;
}

type SortOption = 'recent' | 'level';

const BookmarkPage: React.FC<BookmarkPageProps> = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort states
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  } | null>(null);

  // Statistics
  const [stats, setStats] = useState<BookmarkStats | null>(null);

  // Edit mode
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');

  // Fetch bookmarks
  const fetchBookmarks = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const options: GetBookmarksOptions = {
        sortBy,
        page,
        limit: 20,
      };

      if (selectedLevel !== 'all') {
        options.level = selectedLevel;
      }

      const response = await bookmarkService.getBookmarks(options);

      if (response.success && response.data) {
        // Backend에서 { bookmarks, pagination } 객체 반환
        const { bookmarks: bookmarkList, pagination: paginationInfo } = response.data as any;

        if (Array.isArray(bookmarkList)) {
          setBookmarks(bookmarkList);
          setPagination(paginationInfo);
          setCurrentPage(page);
        } else {
          console.error('Invalid response format: bookmarks is not an array', response.data);
          setBookmarks([]);
          setError('북마크를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        setBookmarks([]);
        setError('북마크를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setBookmarks([]);
      setError('북마크를 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await bookmarkService.getBookmarkStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching bookmark stats:', err);
    }
  };

  useEffect(() => {
    fetchBookmarks(1); // 필터 변경 시 첫 페이지로
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, sortBy]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchBookmarks(page);
  };

  // Handle bookmark removal
  const handleRemoveBookmark = async (wordId: string) => {
    if (!window.confirm('이 북마크를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await bookmarkService.removeBookmark(wordId);
      if (response.success) {
        setBookmarks(prev => prev.filter(b => b.word._id !== wordId));
        fetchStats(); // Refresh stats
      }
    } catch (err) {
      console.error('Error removing bookmark:', err);
      alert('북마크 삭제에 실패했습니다.');
    }
  };

  // Handle notes update
  const handleUpdateNotes = async (wordId: string) => {
    try {
      const response = await bookmarkService.updateBookmarkNotes(wordId, editNotes);
      if (response.success) {
        // Update local state
        setBookmarks(prev =>
          prev.map(b =>
            b.word._id === wordId ? { ...b, notes: editNotes } : b
          )
        );
        setEditingBookmark(null);
        setEditNotes('');
      }
    } catch (err) {
      console.error('Error updating notes:', err);
      alert('메모 업데이트에 실패했습니다.');
    }
  };

  const startEditingNotes = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark.word._id);
    setEditNotes(bookmark.notes || '');
  };

  const cancelEditing = () => {
    setEditingBookmark(null);
    setEditNotes('');
  };

  if (isLoading) {
    return (
      <CenterDiv>
        <LoadingMessage>북마크를 불러오는 중...</LoadingMessage>
      </CenterDiv>
    );
  }

  return (
    <BookmarkContainer>
      <PageHeader>
        <h1>내 북마크</h1>
      </PageHeader>

      {/* Statistics Section */}
      {stats && (
        <StatsSection>
          <StatCard>
            <StatLabel>총 북마크</StatLabel>
            <StatValue>{stats.totalBookmarks || 0}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>완료한 단어</StatLabel>
            <StatValue>{stats.completedBookmarks || 0}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>완료율</StatLabel>
            <StatValue>
              {stats.totalBookmarks > 0
                ? Math.round((stats.completedBookmarks / stats.totalBookmarks) * 100)
                : 0}%
            </StatValue>
          </StatCard>
        </StatsSection>
      )}

      {/* Filter and Sort Controls */}
      <ControlSection>
        <FilterGroup>
          <FilterLabel>레벨 필터:</FilterLabel>
          <Select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as LearningLevel | 'all')}
          >
            <option value="all">전체</option>
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </Select>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>정렬:</FilterLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="recent">최근 순</option>
            <option value="level">레벨 순</option>
            <option value="step">단계 순</option>
          </Select>
        </FilterGroup>
      </ControlSection>

      {error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}

      {/* Bookmarks List */}
      {bookmarks.length === 0 ? (
        <EmptyState>
          <h2>북마크가 없습니다</h2>
          <p>학습 중 어려운 단어를 북마크로 저장하세요.</p>
        </EmptyState>
      ) : (
        <BookmarkList>
          {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark._id}>
              <CardHeader>
                <WordInfo>
                  <Kanji>{bookmark.word.pron || bookmark.word.entry}</Kanji>
                  <Reading>{bookmark.word.entry}</Reading>
                </WordInfo>
                <LevelBadge $level={bookmark.word.level}>
                  {bookmark.word.level} - Step {bookmark.word.step}
                </LevelBadge>
              </CardHeader>

              <Meanings>
                {bookmark.word.means.map((meaning, idx) => (
                  <MeaningItem key={idx}>{meaning}</MeaningItem>
                ))}
              </Meanings>

              <PartsOfSpeech>
                {bookmark.word.parts.map((part, idx) => (
                  <PartTag key={idx}>{part}</PartTag>
                ))}
              </PartsOfSpeech>

              {/* Notes Section */}
              <NotesSection>
                {editingBookmark === bookmark.word._id ? (
                  <>
                    <NotesTextarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="메모를 입력하세요..."
                    />
                    <NotesActions>
                      <SmallButton onClick={() => handleUpdateNotes(bookmark.word._id)}>
                        저장
                      </SmallButton>
                      <SmallButton $variant="secondary" onClick={cancelEditing}>
                        취소
                      </SmallButton>
                    </NotesActions>
                  </>
                ) : (
                  <>
                    {bookmark.notes ? (
                      <NotesDisplay onClick={() => startEditingNotes(bookmark)}>
                        {bookmark.notes}
                      </NotesDisplay>
                    ) : (
                      <AddNotesButton onClick={() => startEditingNotes(bookmark)}>
                        + 메모 추가
                      </AddNotesButton>
                    )}
                  </>
                )}
              </NotesSection>

              <CardFooter>
                <BookmarkedDate>
                  {new Date(bookmark.bookmarked_at).toLocaleDateString('ko-KR')}
                </BookmarkedDate>
                <RemoveButton onClick={() => handleRemoveBookmark(bookmark.word._id)}>
                  삭제
                </RemoveButton>
              </CardFooter>
            </BookmarkCard>
          ))}
        </BookmarkList>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationContainer>
          <PageButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            이전
          </PageButton>

          <PageInfo>
            {currentPage} / {pagination.totalPages} 페이지
            <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
              (총 {pagination.totalItems}개)
            </span>
          </PageInfo>

          <PageButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
          >
            다음
          </PageButton>
        </PaginationContainer>
      )}
    </BookmarkContainer>
  );
};

export default BookmarkPage;

// Styled Components
const BookmarkContainer = styled.div`
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    color: #2c3e50;
    margin: 0;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  text-align: center;
  ${props => props.theme.outerShadow}
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #3498db;
`;

const ControlSection = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  ${props => props.theme.outerShadow}

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-weight: 500;
  color: #2c3e50;
  white-space: nowrap;
`;

const Select = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  background-color: white;
  cursor: pointer;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const LoadingMessage = styled.div`
  font-size: 1.2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  background-color: #fff0f0;
  color: #d32f2f;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 0.5rem;
  ${props => props.theme.outerShadow}

  h2 {
    color: #7f8c8d;
    margin-bottom: 0.5rem;
  }

  p {
    color: #95a5a6;
  }
`;

const BookmarkList = styled.div`
  display: grid;
  gap: 1rem;
`;

const BookmarkCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  ${props => props.theme.outerShadow}
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const WordInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const Kanji = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
`;

const Reading = styled.div`
  font-size: 1.1rem;
  color: #7f8c8d;
`;

const LevelBadge = styled.span<{ $level: LearningLevel }>`
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: bold;
  background-color: ${props => {
    switch (props.$level) {
      case 'N5': return '#e74c3c';
      case 'N4': return '#e67e22';
      case 'N3': return '#f39c12';
      case 'N2': return '#3498db';
      case 'N1': return '#9b59b6';
      default: return '#95a5a6';
    }
  }};
  color: white;
`;

const Meanings = styled.div`
  margin-bottom: 1rem;
`;

const MeaningItem = styled.div`
  padding: 0.3rem 0;
  color: #2c3e50;
  font-size: 1rem;

  &:before {
    content: '• ';
    color: #3498db;
  }
`;

const PartsOfSpeech = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const PartTag = styled.span`
  padding: 0.2rem 0.6rem;
  background-color: #ecf0f1;
  color: #34495e;
  border-radius: 0.3rem;
  font-size: 0.85rem;
`;

const NotesSection = styled.div`
  margin: 1rem 0;
  padding: 0.8rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  min-height: 60px;
`;

const NotesDisplay = styled.div`
  color: #34495e;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.3rem;

  &:hover {
    background-color: #e9ecef;
  }
`;

const NotesTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.3rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const NotesActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const AddNotesButton = styled.button`
  background: none;
  border: 1px dashed #bdc3c7;
  color: #7f8c8d;
  padding: 0.5rem;
  border-radius: 0.3rem;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;

  &:hover {
    border-color: #3498db;
    color: #3498db;
  }
`;

const SmallButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 0.3rem;
  background-color: ${props => props.$variant === 'secondary' ? '#95a5a6' : '#3498db'};
  color: white;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    opacity: 0.9;
  }
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
`;

const BookmarkedDate = styled.span`
  font-size: 0.9rem;
  color: #95a5a6;
`;

const RemoveButton = styled.button`
  padding: 0.4rem 0.8rem;
  background-color: transparent;
  color: #e74c3c;
  border: 1px solid #e74c3c;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e74c3c;
    color: white;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
  padding: 1.5rem 0;
`;

const PageButton = styled.button<{ disabled?: boolean }>`
  padding: 0.6rem 1.5rem;
  background-color: ${props => props.disabled ? '#ecf0f1' : '#3498db'};
  color: ${props => props.disabled ? '#95a5a6' : 'white'};
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.disabled ? '#ecf0f1' : '#2980b9'};
  }
`;

const PageInfo = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: #2c3e50;
`;
