import { FC, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { RootState } from 'store';
import { setActiveProgressType } from 'store/modules/user';
import deckService from 'services/deckService';
import { updateActiveProgressType } from 'services/userService';
import { updateLocalUser } from 'services/authService';
import { CurrentDeck } from 'services/types';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import * as styles from './Main.css';

interface SessionState {
  data: CurrentDeck | null;
  loading: boolean;
}

const SessionCard: FC<{
  type: 'main' | 'sub';
  label: string;
  isActive: boolean;
  session: SessionState;
  onEnter: (type: 'main' | 'sub') => void;
  disabled: boolean;
}> = ({ type, label, isActive, session, onEnter, disabled }) => (
  <button
    className={clsx(styles.sessionCard, isActive && styles.sessionCardActive)}
    onClick={() => onEnter(type)}
    disabled={disabled}
    type="button"
  >
    {isActive && <span className={styles.activeLabel}>최근 학습</span>}
    <span className={styles.sessionLabel}>{label}</span>

    <div className={styles.sessionInfo}>
      {session.loading ? (
        <span className={styles.infoEmpty}>불러오는 중...</span>
      ) : session.data ? (
        <>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>레벨</span>
            <span className={styles.infoValue}>{session.data.level}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>스텝</span>
            <span className={styles.infoValue}>
              {session.data.steps.start} – {session.data.steps.end}
            </span>
          </div>
        </>
      ) : (
        <span className={styles.infoEmpty}>세션 없음</span>
      )}
    </div>

    <span className={styles.ctaBtn}>
      {session.data ? '이어하기' : '시작하기'}
    </span>
  </button>
);

const Main: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);

  const [mainSession, setMainSession] = useState<SessionState>({ data: null, loading: true });
  const [subSession, setSubSession] = useState<SessionState>({ data: null, loading: true });
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    deckService.getCurrentDeck('main')
      .then(res => setMainSession({ data: res.success && res.data ? res.data : null, loading: false }))
      .catch(() => setMainSession({ data: null, loading: false }));

    deckService.getCurrentDeck('sub')
      .then(res => setSubSession({ data: res.success && res.data ? res.data : null, loading: false }))
      .catch(() => setSubSession({ data: null, loading: false }));
  }, [isLoggedIn]);

  const handleEnter = async (type: 'main' | 'sub') => {
    if (isSwitching) return;

    if (type !== activeProgressType) {
      setIsSwitching(true);
      setSwitchError(null);
      try {
        await updateActiveProgressType(type);
        dispatch(setActiveProgressType(type));
        updateLocalUser({ activeProgressType: type });
      } catch {
        setSwitchError('세션 전환에 실패했습니다. 다시 시도해주세요.');
        setIsSwitching(false);
        return;
      }
      setIsSwitching(false);
    }

    const hasSession = type === 'main' ? mainSession.data : subSession.data;
    navigate(hasSession ? '/flash-cards' : '/level-setup');
  };

  if (!isLoggedIn) {
    return (
      <CenterDiv>
        <DefaultButton onClick={() => navigate('/login')}>시작하기</DefaultButton>
      </CenterDiv>
    );
  }

  return (
    <CenterDiv>
      <div className={styles.wrapper}>
        <h1 className={styles.heading}>학습 세션</h1>
        {switchError && (
          <div className="error-box" style={{ width: '100%' }}>{switchError}</div>
        )}
        <div className={styles.sessionGrid}>
          <SessionCard
            type="main"
            label="메인"
            isActive={activeProgressType === 'main'}
            session={mainSession}
            onEnter={handleEnter}
            disabled={isSwitching}
          />
          <SessionCard
            type="sub"
            label="서브"
            isActive={activeProgressType === 'sub'}
            session={subSession}
            onEnter={handleEnter}
            disabled={isSwitching}
          />
        </div>
      </div>
    </CenterDiv>
  );
};

export default Main;
