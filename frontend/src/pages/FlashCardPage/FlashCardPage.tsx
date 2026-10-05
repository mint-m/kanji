import { FC, useEffect, useState, useCallback, useRef } from 'react';
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
  // 완료 화면에서 이탈 후 재진입하면 서버는 currentIndex = 덱 길이로 응답한다 → 완료 상태를 복원해 진행 버튼을 보여준다
  const [initialPassResult, setInitialPassResult] = useState<{ windowComplete: boolean } | null>(null);
  const [liveIndex, setLiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSlow, setIsSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckKey, setDeckKey] = useState(0);
  // completeDeck 성공 후 fetchDeck만 실패한 경우, 재시도 시 서버 완료를 중복 호출하지 않도록 추적
  const deckCompletedRef = useRef(false);

  const fetchDeck = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const progressType = activeProgressType || 'main';
      const response = await deckService.getCurrentDeck(progressType);
      if (response.success && response.data) {
        const { words, level: deckLevel, steps: deckSteps, currentIndex: apiCurrentIndex, deckStatus } = response.data;
        setDeck(words);
        setLevel(deckLevel);
        setSteps(deckSteps);
        setCurrentIndex(apiCurrentIndex);
        setInitialPassResult(deckStatus.isPassComplete ? { windowComplete: deckStatus.isWindowComplete } : null);
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

  // 패스 완료: 몰랐던 단어로 재구성된 덱을 다시 불러온다 (서버가 이미 재셔플 완료)
  // 진행 저장 실패 시에도 같은 동작으로 서버에 저장된 위치에서 이어간다
  const handleContinue = useCallback(async (): Promise<boolean> => {
    const ok = await fetchDeck();
    if (ok) setDeckKey(k => k + 1);
    return ok;
  }, [fetchDeck]);

  // 윈도우 완료: complete-deck으로 다음 윈도우/서브 루프를 만든 뒤 새 덱을 불러온다
  const handleAdvance = useCallback(async (): Promise<boolean> => {
    // 이미 서버 완료 처리가 끝났다면 재시도 시 completeDeck을 건너뛴다 (중복 호출 시 400 발생)
    if (!deckCompletedRef.current) {
      try {
        const response = await deckService.completeDeck(activeProgressType || 'main');
        deckCompletedRef.current = true;
        // 레벨의 마지막 윈도우면 다음 윈도우가 없다 → 레벨 선택으로 이동
        if (response.data && !response.data.isSubLoop && !response.data.canGenerateNext) {
          navigate('/level-setup', { replace: true });
          return true;
        }
      } catch (e) {
        console.error('Failed to complete deck:', e);
        setError('완료 처리에 실패했습니다. 다시 시도해주세요.');
        return false;
      }
    }
    const ok = await fetchDeck();
    if (!ok) return false;
    deckCompletedRef.current = false;
    setDeckKey(k => k + 1);
    return true;
  }, [activeProgressType, fetchDeck, navigate]);

  const handleGoHome = useCallback(() => navigate('/'), [navigate]);

  useEffect(() => { fetchDeck(); }, [fetchDeck]);

  // 로딩이 5초를 넘기면 서버 콜드 스타트일 가능성이 높다 → 기다려야 하는 이유를 알려준다
  useEffect(() => {
    if (!isLoading) { setIsSlow(false); return; }
    const timer = setTimeout(() => setIsSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <div className={styles.page}>
      <Kanji />
      <div className={styles.flashCardArea}>
        <HeaderSection
          title={level}
          subtitle={steps ? (activeProgressType === 'sub' ? `${steps.start}` : `${steps.start}~${steps.end}`) : ''}
          progress={deck ? `${Math.min(liveIndex + 1, deck.length)} / ${deck.length}` : undefined}
        />
        {error && <div className="error-box" style={{ margin: '20px 0' }}>{error}</div>}
        {deck && (
          <FlashCardContainer
            key={deckKey}
            deck={deck}
            progressType={activeProgressType || 'main'}
            initialIndex={currentIndex}
            initialPassResult={initialPassResult}
            onContinue={handleContinue}
            onAdvance={handleAdvance}
            onGoHome={handleGoHome}
            onResync={handleContinue}
            onIndexChange={setLiveIndex}
          />
        )}
        {isLoading && !deck && <SkeletonFlashCard />}
        {isLoading && isSlow && (
          <p className={styles.slowHint}>서버를 깨우는 중이에요. 첫 접속은 최대 1분 정도 걸릴 수 있어요.</p>
        )}
      </div>
    </div>
  );
};

export default FlashCardPage;
