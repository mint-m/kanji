import { FC, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clsx } from 'clsx';
import ReactPageScroller from 'react-page-scroller';
import { RootState } from 'store';
import { setActiveProgressType } from 'store/modules/user';
import SelectStep from 'components/SelectStep';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { api } from 'services/apiClient';
import progressService from 'services/progressService';
import { updateActiveProgressType } from 'services/userService';
import { updateLocalUser } from 'services/authService';
import * as styles from './LevelSelectionPage.css';

interface LevelStepData {
  level: string;
  totalSteps: number;
  totalWords: number;
  stepDistribution: Array<{ _id: number; wordCount: number }>;
  availableSteps: number[];
}

interface ExistingSession {
  level: string;
  steps: { start: number; end: number };
  currentIndex: number;
  totalWords: number;
}

const LEVEL_META: Record<string, { label: string; sub: string }> = {
  daily: { label: '일상', sub: '생활 필수' },
  N5:    { label: 'N5',   sub: '입문' },
  N4:    { label: 'N4',   sub: '초급' },
  N3:    { label: 'N3',   sub: '중급' },
  N2:    { label: 'N2',   sub: '중상급' },
  N1:    { label: 'N1',   sub: '고급' },
};

const LEVELS = Object.keys(LEVEL_META);

const formatStepRange = (start: number, end: number) =>
  start === end ? `${start}` : `${start}~${end}`;

const LevelSelectionPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);
  const progressType = activeProgressType || 'main';
  const isMainSession = progressType === 'main';

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [selectedSteps, setSelectedSteps] = useState(() =>
    isMainSession ? { start: 1, end: 3 } : { start: 1, end: 1 }
  );
  const [levelData, setLevelData] = useState<LevelStepData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingSession, setExistingSession] = useState<ExistingSession | null>(null);

  const hasNoWords = levelData !== null && levelData.totalWords === 0;
  const hasNoSets = isMainSession && levelData !== null && levelData.totalSteps < 3;

  useEffect(() => {
    setExistingSession(null);
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
      .catch(() => {});
  }, [progressType]);

  useEffect(() => {
    if (!selectedLevel) return;
    setLevelData(null);
    let active = true;
    api.get<LevelStepData>(`/api/words/level/${selectedLevel}/steps`)
      .then(res => { if (active) setLevelData(res); })
      .catch(() => { if (active) setLevelData(null); });
    return () => { active = false; };
  }, [selectedLevel]);

  // Redux의 activeProgressType이 마운트 이후 변경되어도 초기값이 갱신되도록 반응형 리셋
  useEffect(() => {
    setSelectedSteps(isMainSession ? { start: 1, end: 3 } : { start: 1, end: 1 });
  }, [isMainSession]);

  const handleSelectLevel = useCallback((level: string) => {
    setSelectedLevel(level);
    setSelectedSteps(isMainSession ? { start: 1, end: 3 } : { start: 1, end: 1 });
    setCurrentPage(1);
  }, [isMainSession]);

  const saveAndStart = async (type: 'main' | 'sub') => {
    await progressService.deleteSession(type).catch(() => {});
    await progressService.saveCheckpoint(type, selectedLevel as any, selectedSteps);
    navigate('/flash-cards');
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await saveAndStart(progressType as 'main' | 'sub');
    } catch {
      alert('진도 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToSub = async () => {
    const previousType = activeProgressType || 'main';
    setIsLoading(true);
    try {
      await updateActiveProgressType('sub');
      dispatch(setActiveProgressType('sub'));
      updateLocalUser({ activeProgressType: 'sub' });
      const subSteps = { start: selectedSteps.start, end: selectedSteps.start };
      await progressService.deleteSession('sub').catch(() => {});
      await progressService.saveCheckpoint('sub', selectedLevel as any, subSteps);
      navigate('/flash-cards');
    } catch {
      await updateActiveProgressType(previousType).catch(() => {});
      dispatch(setActiveProgressType(previousType));
      updateLocalUser({ activeProgressType: previousType });
      alert('서브 세션 전환에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const approxWords = levelData
    ? (levelData.stepDistribution ?? [])
        .filter(s => s._id >= selectedSteps.start && s._id <= selectedSteps.end)
        .reduce((sum, s) => sum + s.wordCount, 0)
    : 0;

  return (
    <ReactPageScroller pageOnChange={setCurrentPage} customPageNumber={currentPage} renderAllPagesOnFirstRender>

      {/* ── Page 1: 레벨 선택 ── */}
      <div className={styles.page}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>레벨을 선택하세요</h2>
          <div className={styles.levelGrid}>
            {LEVELS.map((level) => {
              const meta = LEVEL_META[level];
              return (
                <button
                  key={level}
                  className={clsx(styles.levelBtn, selectedLevel === level && styles.levelBtnActive)}
                  onClick={() => handleSelectLevel(level)}
                >
                  <span className={styles.levelName}>{meta.label}</span>
                  <span className={styles.levelLabel}>{meta.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page 2: 스텝 범위 선택 ── */}
      <div className={styles.page}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>범위를 선택하세요</h2>
          {hasNoWords || hasNoSets ? (
            <div className={styles.noWordsBox}>
              {hasNoWords
                ? <><strong>'{selectedLevel}' 레벨에 아직 단어가 없습니다.</strong><br />스크립트를 실행하여 단어를 먼저 추가해주세요.</>
                : <><strong>'{selectedLevel}' 레벨에 3스텝 세트가 없습니다.</strong><br />단어 스텝 수가 3 미만입니다.</>
              }
            </div>
          ) : (
            <>
              <SelectStep
                progressLevel={selectedLevel}
                stepLength={levelData?.totalSteps || 6}
                value={selectedSteps}
                onSelectStep={setSelectedSteps}
                fixedWidth={isMainSession ? 3 : 1}
              />
              {levelData && (
                <p className={styles.stepSelectedInfo}>
                  스텝 {formatStepRange(selectedSteps.start, selectedSteps.end)} · 약 {approxWords}개 단어
                </p>
              )}
            </>
          )}
          <div className={styles.navRow}>
            <DefaultButton onClick={() => setCurrentPage(0)}>← 레벨 변경</DefaultButton>
            <DefaultButton onClick={() => setCurrentPage(2)} disabled={levelData === null || hasNoWords || hasNoSets}>다음 →</DefaultButton>
          </div>
        </div>
      </div>

      {/* ── Page 3: 확인 및 시작 (스크롤 가능) ── */}
      <div className={styles.pageScrollable}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>학습 플랜 확인</h2>

          {existingSession && isMainSession && (
            <div className={styles.notRecommendedBox}>
              <p className={styles.notRecommendedTitle}>💡 진도 변경을 권장하지 않습니다</p>
              <p className={styles.notRecommendedDesc}>
                잦은 레벨·범위 변경은 학습 효과를 낮출 수 있습니다.
                다른 범위를 탐색하려면 <strong>서브 세션</strong>을 활용하면
                메인 진도를 유지하면서 자유롭게 시도할 수 있습니다.
              </p>
            </div>
          )}

          {existingSession && (
            <div className={styles.warningBox}>
              <p className={styles.warningTitle}>
                🚨 {isMainSession ? '메인' : '서브'} 세션 진도가 삭제됩니다
              </p>
              <p className={styles.warningDetail}>
                <strong>{existingSession.level}</strong>&nbsp;
                {formatStepRange(existingSession.steps.start, existingSession.steps.end)}단계&nbsp;
                ({existingSession.currentIndex + 1}/{existingSession.totalWords}번째 단어 진행 중)의
                학습 데이터가 <strong>영구 삭제</strong>됩니다.
              </p>
              {isMainSession && (
                <button
                  className={styles.subSessionBtn}
                  onClick={handleSwitchToSub}
                  disabled={isLoading}
                >
                  서브 세션으로 설정하기 →
                </button>
              )}
            </div>
          )}

          <div className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>세션</span>
              <span className={styles.summaryValue}>{isMainSession ? '메인' : '서브'}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>레벨</span>
              <span className={styles.summaryValue}>{LEVEL_META[selectedLevel]?.label ?? selectedLevel}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>범위</span>
              <span className={styles.summaryValue}>스텝 {formatStepRange(selectedSteps.start, selectedSteps.end)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>단어 수</span>
              <span className={styles.summaryValue}>약 {approxWords}개</span>
            </div>
          </div>

          <div className={styles.navRow}>
            <DefaultButton onClick={() => setCurrentPage(1)} disabled={isLoading}>← 범위 변경</DefaultButton>
            <DefaultButton onClick={handleStart} disabled={isLoading}>
              {isLoading ? '시작 중...' : existingSession ? '삭제 후 시작' : '학습 시작'}
            </DefaultButton>
          </div>
        </div>
      </div>

    </ReactPageScroller>
  );
};

export default LevelSelectionPage;
