import { FC, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import deckService from 'services/deckService';
import { DeckWord } from 'services/types';
import Kanji from 'components/Kanji';
import HeaderSection from 'components/HeaderSection';
import FlashCardContainer from 'components/FlashCardContainer';
import { RootState } from 'store';
import * as styles from './FlashCardPage.css';

const SkeletonFlashCard = () => (
  <div className={styles.skeletonWrapper}>
    <div className={styles.skeletonCard} />
    <div className={styles.skeletonBtn} />
  </div>
);

const FlashCardPage: FC = () => {
  const navigate = useNavigate();
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);
  const [deck, setDeck] = useState<DeckWord[] | null>(null);
  const [level, setLevel] = useState('');
  const [steps, setSteps] = useState<{ start: number; end: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deckKey, setDeckKey] = useState(0);
  const [windowComplete, setWindowComplete] = useState(false);

  const fetchDeck = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const progressType = activeProgressType || 'main';
      const response = await deckService.getCurrentDeck(progressType);
      if (response.success && response.data) {
        const { words, level: deckLevel, steps: deckSteps, currentIndex: apiCurrentIndex } = response.data;
        setDeck(words);
        setLevel(deckLevel);
        setSteps(deckSteps);
        setCurrentIndex(apiCurrentIndex);
      } else {
        setError(response.message || '단어장을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to fetch deck:', error);
      if (error.response?.status === 404 && error.response?.data?.code === 'NO_PROGRESS') {
        navigate('/level-setup', { replace: true });
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setError('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError(error.response?.data?.message || '단어장을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeProgressType, navigate]);

  const handlePassComplete = useCallback((_nextPassSize: number) => {
    fetchDeck().then(() => setDeckKey(k => k + 1));
  }, [fetchDeck]);

  const handleWindowComplete = useCallback(() => {
    setWindowComplete(true);
  }, []);

  useEffect(() => { fetchDeck(); }, [fetchDeck]);

  return (
    <div className={styles.page}>
      <Kanji />
      <div className={styles.flashCardArea}>
        <HeaderSection
          title={level}
          subtitle={steps ? `${steps.start} ~ ${steps.end}` : ''}
        />
        {error ? (
          <div className="error-box" style={{ margin: '20px 0' }}>{error}</div>
        ) : windowComplete ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h3>윈도우 완료!</h3>
            <p>이 윈도우의 모든 단어를 완전히 습득했습니다.</p>
            <button onClick={async () => {
              setWindowComplete(false);
              try {
                await deckService.completeDeck(activeProgressType || 'main');
              } catch (e) {
                console.error('Failed to complete deck:', e);
              }
              fetchDeck();
            }}>
              다음 윈도우로 진행
            </button>
          </div>
        ) : (
          <>
            {deck && (
              <FlashCardContainer
                key={deckKey}
                deck={deck}
                progressType={activeProgressType || 'main'}
                initialIndex={currentIndex}
                onPassComplete={handlePassComplete}
                onWindowComplete={handleWindowComplete}
              />
            )}
            {isLoading && <SkeletonFlashCard />}
          </>
        )}
      </div>
    </div>
  );
};

export default FlashCardPage;
