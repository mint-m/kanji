import { FC, useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import deckService from 'services/deckService';
import { DeckWord } from 'services/types';
import Kanji from 'components/Kanji';
import HeaderSection from 'components/HeaderSection';
import FlashCardContainer from 'components/FlashCardContainer';
import DefaultButton from 'components/CommonStyled/DefaultButton';
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
  const [liveIndex, setLiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deckKey, setDeckKey] = useState(0);
  const [windowComplete, setWindowComplete] = useState(false);
  // completeDeck 성공 후 fetchDeck만 실패한 경우, 재시도 시 서버 완료를 중복 호출하지 않도록 추적
  const deckCompletedRef = useRef(false);

  const fetchDeck = useCallback(async (): Promise<boolean> => {
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
        return true;
      }
      setError(response.message || '단어장을 불러오는데 실패했습니다.');
      return false;
    } catch (error: any) {
      console.error('Failed to fetch deck:', error);
      if (error.response?.status === 404 && error.response?.data?.code === 'NO_PROGRESS') {
        navigate('/level-setup', { replace: true });
        return false;
      }
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setError('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError(error.response?.data?.message || '단어장을 불러오는데 실패했습니다.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [activeProgressType, navigate]);

  const handlePassComplete = useCallback(() => {
    fetchDeck().then(() => setDeckKey(k => k + 1));
  }, [fetchDeck]);

  const handleWindowComplete = useCallback(() => {
    setWindowComplete(true);
  }, []);

  const handleAdvance = useCallback(async () => {
    setWindowComplete(false);
    // 이미 서버 완료 처리가 끝났다면 재시도 시 completeDeck을 건너뛴다 (중복 호출 시 400 발생)
    if (!deckCompletedRef.current) {
      try {
        await deckService.completeDeck(activeProgressType || 'main');
        deckCompletedRef.current = true;
      } catch (e) {
        console.error('Failed to complete deck:', e);
        setError('완료 처리에 실패했습니다. 다시 시도해주세요.');
        setWindowComplete(true);
        return;
      }
    }
    const ok = await fetchDeck();
    if (!ok) {
      setWindowComplete(true);
      return;
    }
    deckCompletedRef.current = false;
    setDeckKey(k => k + 1);
  }, [activeProgressType, fetchDeck]);

  useEffect(() => { fetchDeck(); }, [fetchDeck]);

  const isMain = (activeProgressType || 'main') === 'main';

  return (
    <div className={styles.page}>
      <Kanji />
      <div className={styles.flashCardArea}>
        <HeaderSection
          title={level}
          subtitle={steps ? (steps.start === steps.end ? `${steps.start}` : `${steps.start} ~ ${steps.end}`) : ''}
          progress={deck ? `${Math.min(liveIndex + 1, deck.length)} / ${deck.length}` : undefined}
        />
        {error && !windowComplete && (
          <div className="error-box" style={{ margin: '20px 0' }}>{error}</div>
        )}
        {windowComplete ? (
          <div className={styles.windowCompleteCard}>
            {error && <div className="error-box" style={{ marginBottom: '15px' }}>{error}</div>}
            <h3 className={styles.windowCompleteTitle}>
              {isMain ? '윈도우 완료!' : '스텝 마스터!'}
            </h3>
            <p className={styles.windowCompleteDesc}>
              {isMain
                ? '이 윈도우의 모든 단어를 완전히 습득했습니다.'
                : '이 스텝의 모든 단어를 습득했습니다.'}
            </p>
            {!isMain ? (
              <div className={styles.subCompleteActions}>
                <DefaultButton onClick={handleAdvance}>다시 학습하기</DefaultButton>
                <DefaultButton onClick={() => navigate('/')}>홈으로 돌아가기</DefaultButton>
              </div>
            ) : (
              <DefaultButton onClick={handleAdvance}>다음 윈도우로 진행</DefaultButton>
            )}
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
                onIndexChange={setLiveIndex}
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
