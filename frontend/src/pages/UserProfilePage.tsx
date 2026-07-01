import { FC, useEffect, useState } from 'react';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProfile } from 'services/userService';
import { logout, linkGoogleAccount, exchangeCodeForToken, getUserLocally, saveUserLocally } from 'services/authService';
import { useGoogleLogin } from '@react-oauth/google';
import { clsx } from 'clsx';
import * as styles from './UserProfilePage.css';

const KAKAO_REST_API_KEY = process.env['REACT_APP_KAKAO_REST_API_KEY'];
const KAKAO_REDIRECT_URI = process.env['REACT_APP_KAKAO_REDIRECT_URI'];

const UserProfilePage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>((location.state as any)?.linkError ?? null);
  const [linkLoading, setLinkLoading] = useState<string | null>(null);

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

  return (
    <div className={styles.page}>

      {/* 프로필 헤더 */}
      <div className={clsx('card', styles.profileHeader)}>
        <div className={styles.avatar}>
          {(userData.name?.charAt(0) || userData.email.charAt(0)).toUpperCase()}
        </div>
        <div className={styles.profileInfo}>
          <p className={styles.profileName}>{userData.name || '사용자'}</p>
          <p className={styles.profileMeta}>{userData.email}</p>
        </div>
      </div>

      {/* 통계 */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">통계</h2>
        <DefaultButton style={{ width: '100%' }} onClick={() => navigate('/profile/stats')}>
          통계 보기
        </DefaultButton>
      </section>

      {/* 계정 연동 */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">계정 연동</h2>
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

      {/* 로그아웃 */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <DefaultButton
          style={{ backgroundColor: '#f8f9fa', color: '#d32f2f', width: '100%' }}
          onClick={() => { logout(true); navigate('/'); }}
        >
          로그아웃
        </DefaultButton>
      </section>
    </div>
  );
};

export default UserProfilePage;
