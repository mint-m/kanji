import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import progressService from 'services/progressService';
import { LearningLevel } from 'services/types';
import { RootState } from 'store';
import * as styles from './LevelSetupPage.css';

const LEVELS: LearningLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const DEFAULT_STEPS = { start: 1, end: 3 };

const LEVEL_INFO: Record<LearningLevel, { label: string; description: string }> = {
  N5: { label: '입문', description: '일본 초등학생 저학년 수준. 숫자·날짜·간단한 인사말을 이해할 수 있어요.' },
  N4: { label: '초급', description: '일본 초등학생 고학년 수준. 일상적인 대화와 쉬운 글을 읽을 수 있어요.' },
  N3: { label: '중급', description: '일본 중학생 수준. 자연스러운 일상 대화와 신문 요약을 이해할 수 있어요.' },
  N2: { label: '중상급', description: '일본 고등학생 수준. 뉴스·사설·업무 문서를 읽고 이해할 수 있어요.' },
  N1: { label: '고급', description: '일본 대학생·성인 수준. 복잡한 문장과 추상적 표현을 자유롭게 구사해요.' },
};

interface ExistingSession {
  level: LearningLevel;
  steps: { start: number; end: number };
  currentIndex: number;
  totalWords: number;
}

const LevelSetupPage: FC = () => {
  const navigate = useNavigate();
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);
  const progressType = activeProgressType || 'main';
  const [selected, setSelected] = useState<LearningLevel>('N5');
  const [existingSession, setExistingSession] = useState<ExistingSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    progressService.getUserProgress(progressType)
      .then((res) => {
        if (res.success && res.data?.progress) {
          const p = res.data.progress;
          setExistingSession({
            level: p.current_level,
            steps: p.steps,
            currentIndex: p.current_index,
            totalWords: p.shuffled_order?.length ?? 0,
          });
        }
      })
      .catch((err) => {
        if (err?.response?.status !== 404) {
          setError('학습 세션 정보를 불러오는 데 실패했습니다. 페이지를 새로고침해 주세요.');
        }
      })
      .finally(() => setIsCheckingSession(false));
  }, [progressType]);

  const handleSelect = (level: LearningLevel) => {
    setSelected(level);
    setConfirmed(false);
  };

  const handleStart = async () => {
    if (existingSession && !confirmed) return;
    setIsLoading(true);
    setError(null);
    try {
      if (existingSession) {
        await progressService.deleteSession(progressType);
      }
      await progressService.saveCheckpoint(progressType, selected, DEFAULT_STEPS);
      navigate('/flash-cards', { replace: true });
    } catch {
      setError('레벨 설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const canStart = (!existingSession || confirmed) && !error;
  const info = LEVEL_INFO[selected];

  if (isCheckingSession) {
    return <CenterDiv><p>로딩 중...</p></CenterDiv>;
  }

  const warningBlock = existingSession && (
    <div className={styles.warningBox}>
      <p className={styles.warningTitle}>⚠️ 진행 중인 학습이 있습니다</p>
      <p className={styles.warningDetail}>
        현재 <strong>{existingSession.level}</strong>&nbsp;
        {existingSession.steps.start}~{existingSession.steps.end}단계&nbsp;
        ({existingSession.currentIndex + 1}/{existingSession.totalWords} 번째 단어)
      </p>
      <label className={styles.confirmLabel}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        &nbsp;현재 진행 상태를 초기화하고 새로 시작하는 것에 동의합니다
      </label>
    </div>
  );

  const bottomBlock = (
    <>
      {existingSession && !confirmed && (
        <p className={styles.changeWarning}>학습을 시작하려면 위 체크박스에 동의해야 합니다</p>
      )}
      {error && <p className={styles.errorText}>{error}</p>}
      <DefaultButton onClick={handleStart} disabled={!canStart || isLoading}>
        {isLoading ? '시작 중...' : existingSession ? '초기화 후 시작' : '학습 시작'}
      </DefaultButton>
    </>
  );

  return (
    <CenterDiv>
      <div className={styles.page}>
        <h1 className={styles.title}>학습 레벨 선택</h1>
        <p className={styles.subtitle}>시작할 JLPT 레벨을 선택하세요</p>

        {/* PC 레이아웃 */}
        <div className={styles.pcLayout}>
          {warningBlock}
          <div className={styles.descBox}>
            <span className={styles.descLabel}>{selected} · {info.label}</span>
            <span className={styles.descText}>{info.description}</span>
          </div>

          <div className={styles.pcLevelRow}>
            {LEVELS.map((level) => (
              <button
                key={level}
                className={`${styles.pcLevelButton}${selected === level ? ` ${styles.pcLevelButtonSelected}` : ''}`}
                onClick={() => handleSelect(level)}
                type="button"
              >
                {level}
              </button>
            ))}
          </div>

          {bottomBlock}
        </div>

        {/* 모바일 레이아웃 */}
        <div className={styles.mobileLayout}>
          {warningBlock}
          {LEVELS.map((level) => {
            const isSelected = selected === level;
            return (
              <button
                key={level}
                className={`${styles.mobileLevelButton}${isSelected ? ` ${styles.mobileLevelButtonSelected}` : ''}`}
                onClick={() => handleSelect(level)}
                type="button"
              >
                <span className={styles.levelName}>{level}</span>
                <span className={styles.levelLabel}>{LEVEL_INFO[level].label}</span>
                {isSelected && (
                  <span className={styles.mobileDesc}>{LEVEL_INFO[level].description}</span>
                )}
              </button>
            );
          })}

          {bottomBlock}
        </div>
      </div>
    </CenterDiv>
  );
};

export default LevelSetupPage;
