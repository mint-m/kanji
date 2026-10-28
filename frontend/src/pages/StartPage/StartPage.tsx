import { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import progressService from 'services/progressService';
import wordService, { LevelSteps } from 'services/wordService';
import { updateActiveProgressType } from 'services/userService';
import { updateLocalUser } from 'services/authService';
import { getErrorMessage } from 'services/apiClient';
import { LearningLevel, ProgressType, SessionSummary } from 'services/types';
import { setActiveProgressType } from 'store/modules/user';
import { LEVELS, LEVEL_INFO, formatSteps, levelName } from 'constants/levels';
import { RootState } from 'store';
import * as layout from 'styles/layout.css';
import * as styles from './StartPage.css';

const MODES: { type: ProgressType; title: string; desc: string }[] = [
  { type: 'main', title: '진도 학습', desc: '3스텝씩 범위를 한 칸씩 밀며 레벨을 끝까지 익혀요. 범위의 모든 단어를 알아야 다음으로 넘어가요.' },
  { type: 'sub', title: '집중 학습', desc: '한 스텝만 골라 완전히 익힐 때까지 반복해요. 진도 학습 위치는 그대로 남아요.' },
];

const modeTitle = (type: ProgressType) => MODES.find((mode) => mode.type === type)!.title;

const range = (from: number, to: number) => Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);

// 레벨을 다 마치고 넘어왔으면 다음 레벨을 미리 고른다
const initialLevel = (finishedLevel?: LearningLevel): LearningLevel => {
  if (!finishedLevel) return 'N5';
  return LEVELS[LEVELS.indexOf(finishedLevel) + 1] ?? 'N5';
};

// 학습 시작·범위 바꾸기를 한 화면에서 — 진도·집중 학습이 같은 규칙으로 레벨·범위를 고른다
const StartPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const finishedLevel = (useLocation().state as { finishedLevel?: LearningLevel } | null)?.finishedLevel;
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);

  const queryType = searchParams.get('type');
  const [type, setType] = useState<ProgressType>(
    queryType === 'main' || queryType === 'sub' ? queryType : activeProgressType ?? 'main'
  );
  const [level, setLevel] = useState<LearningLevel>(() => initialLevel(finishedLevel));
  const [start, setStart] = useState(1);
  const [steps, setSteps] = useState<LevelSteps | null>(null);
  const [stepsError, setStepsError] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    progressService.getAllSessions()
      .then((res) => setSessions(res.data?.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    let active = true;
    setSteps(null);
    setStepsError(false);
    wordService.getLevelSteps(level)
      .then((data) => { if (active) setSteps(data); })
      .catch(() => { if (active) setStepsError(true); });
    return () => { active = false; };
  }, [level]);

  // 방식·레벨을 바꾸면 범위는 처음부터, 동의는 다시 받는다
  useEffect(() => { setStart(1); }, [level, type]);
  useEffect(() => { setConfirmed(false); }, [type]);

  const width = type === 'main' ? 3 : 1;
  const maxStep = steps?.availableSteps.length ? Math.max(...steps.availableSteps) : 0;
  const canUseMode = maxStep >= width;
  const wordsIn = (from: number) =>
    range(from, from + width - 1).reduce((sum, step) => sum + (steps?.stepDistribution.find((s) => s._id === step)?.wordCount ?? 0), 0);
  const selectedSteps = { start, end: start + width - 1 };
  const words = steps ? wordsIn(start) : 0;

  const existing = sessions?.find((session) => session.type === type);
  // 레벨을 다 마친 진도 학습은 잃을 진행이 없으므로 동의를 묻지 않는다
  const needsConfirm = !!existing && !(finishedLevel && type === 'main');
  const canStart = !!steps && canUseMode && words > 0 && sessions !== null && !submitting
    && (!needsConfirm || type === 'sub' || confirmed);

  const handleStart = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // 이전 시도에서 이미 지워졌을 수 있어 실패해도 이어간다 (남아 있으면 생성이 409로 알려 준다)
      if (existing) await progressService.deleteSession(type).catch(() => {});
      await progressService.saveCheckpoint(type, level, selectedSteps);
      if (activeProgressType !== type) {
        await updateActiveProgressType(type);
        dispatch(setActiveProgressType(type));
        updateLocalUser({ activeProgressType: type });
      }
      navigate('/study', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, '학습을 시작하지 못했어요. 다시 시도해주세요.'));
      setSubmitting(false);
    }
  };

  return (
    <div className={layout.page}>
      <h1 className={layout.pageTitle}>학습 시작</h1>
      <div className={layout.stack}>
        {finishedLevel && (
          <p className={styles.banner} role="status">
            🎉 <strong>{levelName(finishedLevel)}</strong> 레벨의 마지막 범위까지 모두 익혔어요. 다음 레벨을 고르거나 다시 복습해 보세요.
          </p>
        )}

        <section className={layout.card}>
          <h2 className={layout.sectionTitle}>학습 방식</h2>
          <div className={styles.optionGrid} role="radiogroup" aria-label="학습 방식">
            {MODES.map((mode) => (
              <button
                key={mode.type}
                type="button"
                role="radio"
                aria-checked={type === mode.type}
                className={styles.option}
                onClick={() => setType(mode.type)}
              >
                <span className={styles.optionTitle}>{mode.title}</span>
                <span className={styles.optionDesc}>{mode.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={layout.card}>
          <h2 className={layout.sectionTitle}>레벨</h2>
          <div className={styles.levelGrid} role="radiogroup" aria-label="레벨">
            {LEVELS.map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={level === item}
                className={styles.option}
                onClick={() => setLevel(item)}
              >
                <span className={styles.optionTitle}>{LEVEL_INFO[item].name} · {LEVEL_INFO[item].label}</span>
                <span className={styles.optionDesc}>{LEVEL_INFO[item].description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={layout.card}>
          <h2 className={layout.sectionTitle}>{type === 'main' ? '시작 범위' : '스텝'}</h2>
          {stepsError ? (
            <p className={styles.error}>범위를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
          ) : !steps ? (
            <p className={layout.muted}>불러오는 중...</p>
          ) : !canUseMode ? (
            <p className={layout.muted}>
              {maxStep === 0
                ? '이 레벨에는 아직 단어가 없어요.'
                : '이 레벨은 스텝이 3개보다 적어 진도 학습을 할 수 없어요. 집중 학습을 이용해 주세요.'}
            </p>
          ) : (
            <>
              <div className={styles.rangeGrid} role="radiogroup" aria-label={type === 'main' ? '시작 범위' : '스텝'}>
                {range(1, maxStep - width + 1).map((from) => (
                  <button
                    key={from}
                    type="button"
                    role="radio"
                    aria-checked={start === from}
                    className={styles.rangeOption}
                    onClick={() => setStart(from)}
                  >
                    <span>{type === 'main' ? `${from}–${from + 2}` : from}</span>
                    <span className={styles.rangeWords}>{wordsIn(from)}개</span>
                  </button>
                ))}
              </div>
              {type === 'main' && (
                <p className={layout.muted} style={{ marginTop: 12 }}>
                  처음이라면 1–3부터 시작하세요. 범위를 마치면 한 스텝씩 밀려 다음 범위가 열려요.
                </p>
              )}
            </>
          )}
        </section>

        <section className={layout.card}>
          <div className={styles.summary}>
            <span className={styles.summaryStrong}>{modeTitle(type)}</span>
            <span>{levelName(level)} · {formatSteps(selectedSteps, type)}</span>
            <span>단어 {words}개</span>
          </div>

          {existing && needsConfirm && (
            <div className={styles.warning}>
              <span>
                진행 중인 {modeTitle(existing.type)}({levelName(existing.level)} {formatSteps(existing.steps, existing.type)},
                익힘 {existing.window.known}/{existing.window.total})이 이 설정으로 바뀌어요.
                익힌 단어·복습 기록·북마크는 그대로 남아요.
              </span>
              {type === 'main' && (
                <label className={styles.confirm}>
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  진도 위치를 바꾸는 데 동의합니다
                </label>
              )}
            </div>
          )}

          <div className={styles.startRow}>
            {error && <span className={styles.error} role="alert">{error}</span>}
            <DefaultButton variant="primary" onClick={handleStart} disabled={!canStart}>
              {submitting ? '시작하는 중...' : needsConfirm ? '바꾸고 시작' : '학습 시작'}
            </DefaultButton>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StartPage;
