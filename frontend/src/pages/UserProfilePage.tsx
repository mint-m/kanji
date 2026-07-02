import { FC, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from 'store/modules/user';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProfile, getStats, updateName } from 'services/userService';
import deckService from 'services/deckService';
import { CurrentDeck } from 'services/types';
import { logout, linkGoogleAccount, exchangeCodeForToken, getUserLocally, saveUserLocally, updateLocalUser } from 'services/authService';
import { useGoogleLogin } from '@react-oauth/google';
import * as styles from './UserProfilePage.css';

const KAKAO_REST_API_KEY = process.env['REACT_APP_KAKAO_REST_API_KEY'];
const KAKAO_REDIRECT_URI = process.env['REACT_APP_KAKAO_REDIRECT_URI'];

const UserProfilePage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>((location.state as any)?.linkError ?? null);
  const [linkLoading, setLinkLoading] = useState<string | null>(null);

  // 닉네임 편집
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // 간단한 통계
  const [progress, setProgress] = useState<number | null>(null);
  const [currentDeck, setCurrentDeck] = useState<CurrentDeck | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const fetchUserData = async () => {
      try {
        const storedUser = getUserLocally();
        if (storedUser) {
          setUserData(storedUser);
        } else {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Not authenticated');
          setUserData(await getProfile());
        }
      } catch {
        setError('프로필 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // 최근 학습 위치 + 진도
  useEffect(() => {
    if (!userData) return;
    let active = true;
    getStats()
      .then((s) => { if (active) setProgress(s.overall.progressPercentage); })
      .catch(() => {});
    const type = userData.activeProgressType;
    if (type) {
      deckService.getCurrentDeck(type)
        .then((res) => { if (active && res.success && res.data) setCurrentDeck(res.data); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [userData]);

  const startEditName = () => {
    setNameInput(userData.name || '');
    setNameError(null);
    setIsEditingName(true);
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError('닉네임을 입력해주세요'); return; }
    if (trimmed === userData.name) { setIsEditingName(false); return; }
    setNameSaving(true);
    setNameError(null);
    try {
      const { name } = await updateName(trimmed);
      setUserData({ ...userData, name });
      updateLocalUser({ name });
      dispatch(setUser({ name }));
      setIsEditingName(false);
    } catch {
      setNameError('닉네임 변경에 실패했습니다.');
    } finally {
      setNameSaving(false);
    }
  };

  const googleLinkLogin = useGoogleLogin({
    flow: 'auth-code',
    scope: 'email profile',
    redirect_uri: 'postmessage',
    onSuccess: async (response) => {
      setLinkLoading('google');
      setLinkError(null);
      try {
        const { accessToken } = await exchangeCodeForToken(response.code);
        const authProviders = await linkGoogleAccount(accessToken);
        const stored = getUserLocally();
        if (stored) {
          stored.authProviders = authProviders;
          saveUserLocally(stored);
          setUserData({ ...stored });
        }
      } catch {
        setLinkError('Google 계정 연동에 실패했습니다.');
      } finally {
        setLinkLoading(null);
      }
    },
    onError: () => setLinkError('Google 인증에 실패했습니다.'),
  });

  const handleKakaoLink = () => {
    if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) return;
    const url =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${KAKAO_REST_API_KEY}` +
      `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=account_email,profile_nickname` +
      `&state=link`;
    window.location.href = url;
  };

  const linkedProviders: string[] = userData?.authProviders ?? (userData?.type ? [userData.type] : []);

  if (isLoading) {
    return <CenterDiv><div className="loading-text">불러오는 중...</div></CenterDiv>;
  }

  if (error || !userData) {
    return (
      <CenterDiv>
        <div className="error-box" style={{ textAlign: 'center', maxWidth: '360px' }}>
          <h2 style={{ marginTop: 0 }}>프로필 오류</h2>
          <p>{error || '데이터를 불러올 수 없습니다.'}</p>
          <DefaultButton onClick={() => navigate('/login')}>로그인으로 돌아가기</DefaultButton>
        </div>
      </CenterDiv>
    );
  }

  const levelText = currentDeck?.level ?? '—';
  const stepText = currentDeck?.steps ? `${currentDeck.steps.start}–${currentDeck.steps.end}` : '—';
  const progressText = progress !== null ? `${progress}%` : '—';

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>프로필</h1>

      {/* 프로필 헤더 */}
      <div className={`${styles.card} ${styles.profileHeader}`}>
        <div className={styles.headerTop}>
          <div className={styles.profileInfo}>
            {isEditingName ? (
              <>
                <div className={styles.nameEdit}>
                  <input
                    className={styles.nameInput}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setIsEditingName(false); }}
                    maxLength={20}
                    autoFocus
                  />
                  <button className={styles.nameSaveBtn} onClick={saveName} disabled={nameSaving}>
                    {nameSaving ? '저장 중...' : '저장'}
                  </button>
                  <button className={styles.nameCancelBtn} onClick={() => setIsEditingName(false)}>취소</button>
                </div>
                {nameError && <p className={styles.fieldError}>{nameError}</p>}
              </>
            ) : (
              <div className={styles.nameRow}>
                <p className={styles.profileName}>{userData.name || '사용자'}</p>
                <button className={styles.editBtn} onClick={startEditName}>수정</button>
              </div>
            )}
            <p className={styles.profileMeta}>{userData.email}</p>
          </div>
          <button className={styles.logoutBtn} onClick={() => { logout(true); navigate('/'); }}>로그아웃</button>
        </div>

        <div className={styles.statsGroup}>
          <div className={styles.miniStats}>
            <span className={styles.miniStatItem}>
              <span className={styles.miniLabel}>레벨</span>
              <span className={styles.miniValue}>{levelText}</span>
            </span>
            <span className={styles.miniStatItem}>
              <span className={styles.miniLabel}>스텝</span>
              <span className={styles.miniValue}>{stepText}</span>
            </span>
            <span className={styles.miniStatItem}>
              <span className={styles.miniLabel}>진도</span>
              <span className={styles.miniValue}>{progressText}</span>
            </span>
          </div>
          <button className={styles.statsBtn} onClick={() => navigate('/profile/stats')}>학습 통계</button>
        </div>
      </div>

      {/* 계정 연동 */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>계정 연동</h2>
        <div className={styles.providerList}>
          <div className={styles.providerRow}>
            <span className={styles.providerName}>Google</span>
            {linkedProviders.includes('google') ? (
              <span className={styles.linkedBadge}>연동됨</span>
            ) : (
              <button
                className={styles.linkBtn}
                onClick={() => googleLinkLogin()}
                disabled={linkLoading === 'google'}
              >
                {linkLoading === 'google' ? '연동 중...' : '연동하기'}
              </button>
            )}
          </div>
          <div className={styles.providerRow}>
            <span className={styles.providerName}>Kakao</span>
            {linkedProviders.includes('kakao') ? (
              <span className={styles.linkedBadge}>연동됨</span>
            ) : (
              <button
                className={styles.linkBtn}
                onClick={handleKakaoLink}
                disabled={linkLoading === 'kakao'}
              >
                연동하기
              </button>
            )}
          </div>
        </div>
        {linkError && <p className={styles.linkErrorMsg}>{linkError}</p>}
      </section>
    </div>
  );
};

export default UserProfilePage;
