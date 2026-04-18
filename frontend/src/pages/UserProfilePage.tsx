import { FC, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'store';
import UserProgress from 'components/UserProgress';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';
import { setActiveProgressType } from 'store/modules/user';
import { updateActiveProgressType, getProfile } from 'services/userService';
import { logout } from 'services/authService';
import deckService from 'services/deckService';
import { CurrentDeck } from 'services/types';
import { clsx } from 'clsx';
import * as styles from './UserProfilePage.css';

const UserProfilePage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const [progressData, setProgressData] = useState<CurrentDeck | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        } else {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Not authenticated');
          setUserData(await getProfile());
        }
      } catch {
        setError('Failed to load your profile information');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!activeProgressType) { setProgressData(null); return; }
    setIsLoadingProgress(true);
    deckService.getCurrentDeck(activeProgressType)
      .then(res => { if (res.success && res.data) setProgressData(res.data); })
      .catch(() => {})
      .finally(() => setIsLoadingProgress(false));
  }, [activeProgressType]);

  const handleSessionToggle = async (type: 'main' | 'sub') => {
    if (isUpdatingSession || type === activeProgressType) return;
    setIsUpdatingSession(true);
    try {
      await updateActiveProgressType(type);
      dispatch(setActiveProgressType(type));
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.activeProgressType = type;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
    } catch {
      setError('세션 전환에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUpdatingSession(false);
    }
  };

  if (isLoading) {
    return <CenterDiv><div className="loading-text">Loading your profile...</div></CenterDiv>;
  }

  if (error || !userData) {
    return (
      <CenterDiv>
        <div className="error-box" style={{ textAlign: 'center', maxWidth: '360px' }}>
          <h2 style={{ color: '#d32f2f', marginTop: 0 }}>Error Loading Profile</h2>
          <p>{error || 'Failed to load profile data'}</p>
          <DefaultButton onClick={() => navigate('/login')}>Return to Login</DefaultButton>
        </div>
      </CenterDiv>
    );
  }

  return (
    <div className={styles.page}>
      {/* Profile Header */}
      <div className={clsx('card', styles.profileHeader)}>
        <div className={styles.avatar}>
          {userData.name?.charAt(0) || userData.email.charAt(0)}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{userData.name || 'User'}</h1>
          <p className={styles.profileMeta}>{userData.email}</p>
          <p className={styles.profileMeta}>Account type: {userData.type}</p>
        </div>
      </div>

      {/* Learning Section */}
      <section className="card" style={{ marginBottom: '32px' }}>
        <h2 className="section-title">Learning Session</h2>
        <div className={styles.sessionBtns}>
          {(['main', 'sub'] as const).map((type) => (
            <button
              key={type}
              className={clsx(styles.sessionBtn, activeProgressType === type && styles.sessionBtnActive)}
              onClick={() => handleSessionToggle(type)}
              disabled={isUpdatingSession}
            >
              {type === 'main' ? 'Main' : 'Sub'}
            </button>
          ))}
        </div>

        <h2 className="section-title">Current Learning</h2>
        {isLoadingProgress ? (
          <div className="loading-text" style={{ padding: '16px' }}>Loading progress...</div>
        ) : progressData ? (
          <div className={styles.progressRow}>
            <div className={styles.progressCell}>
              <span className={styles.progressCellLabel}>Level</span>
              <span className={styles.progressCellValue}>{progressData.level || 'N/A'}</span>
            </div>
            <div className={styles.progressCell}>
              <span className={styles.progressCellLabel}>Steps</span>
              <span className={styles.progressCellValue}>
                {progressData.steps ? `${progressData.steps.start} - ${progressData.steps.end}` : 'N/A'}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.noProgress}>No active learning session. Start by selecting a level!</div>
        )}

        <div className={styles.actionBtns}>
          <DefaultButton style={{ flex: 1, padding: '12px 16px' }} onClick={() => navigate('/select-level')}>학습 단계 변경</DefaultButton>
          <DefaultButton style={{ flex: 1, padding: '12px 16px' }} onClick={() => navigate('/flash-cards')}>학습 이어하기</DefaultButton>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ marginBottom: '32px' }}>
        <h2 className="section-title">Learning Progress</h2>
        <UserProgress />
      </section>

      {/* Account Section */}
      <section className={clsx('card', styles.accountSection)} style={{ marginBottom: '32px' }}>
        <h2 className="section-title">Account</h2>
        <DefaultButton
          style={{ backgroundColor: '#f8f9fa', color: '#d32f2f' }}
          onClick={() => { logout(true); navigate('/'); }}
        >
          Log Out
        </DefaultButton>
      </section>
    </div>
  );
};

export default UserProfilePage;
