import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import { AppHeader, TabBar } from 'components/Navigation';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from 'components/ErrorBoundary';
import { setUser } from 'store/modules/user';
import { AuthBannerProvider } from 'contexts/AuthBannerContext';
import { loginWithGoogleIdToken, toUserState, getUserLocally } from 'services/authService';
import KakaoOAuthCallback from 'components/auth/KakaoOAuthCallback';
import type { RootState } from 'store';

const Main = lazy(() => import('pages/Main'));
const NotFound = lazy(() => import('pages/NotFound'));
const Login = lazy(() => import('pages/Login'));
const FlashCard = lazy(() => import('pages/FlashCardPage'));
const UserProfile = lazy(() => import('pages/UserProfilePage'));
const Bookmark = lazy(() => import('pages/BookmarkPage'));
const BookmarkStudy = lazy(() => import('pages/BookmarkStudyPage'));
const Start = lazy(() => import('pages/StartPage'));
const Stats = lazy(() => import('pages/StatsPage'));
const Review = lazy(() => import('pages/ReviewPage'));
const Sources = lazy(() => import('pages/SourcesPage'));

const AppContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);

  useEffect(() => {
    const storedUser = getUserLocally();
    if (storedUser) {
      dispatch(setUser(toUserState(storedUser)));
    }
  }, [dispatch]);

  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      if (!credentialResponse.credential) return;
      try {
        const res = await loginWithGoogleIdToken(credentialResponse.credential);
        dispatch(setUser(toUserState(res.user)));
        navigate('/');
      } catch (err) {
        console.error('One Tap login error:', err);
      }
    },
    use_fedcm_for_prompt: true,
    cancel_on_tap_outside: false,
    disabled: isLoggedIn || !!getUserLocally(),
  });

  return (
    <AuthBannerProvider>
      <AppHeader />
      <main>
        {/* 경로가 바뀌면 다시 시도하도록 key로 초기화한다 */}
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<CenterDiv><p className="loading-text">불러오는 중...</p></CenterDiv>}>
            <Routes>
              <Route path='/' element={<Main />} />
              <Route path='/login' element={<Login />} />
              <Route path='/auth/kakao/callback' element={<KakaoOAuthCallback />} />
              <Route path='/sources' element={<Sources />} />
              <Route path='*' element={<NotFound />} />

              <Route path='/profile' element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />

              <Route path='/review' element={
                <ProtectedRoute>
                  <Review />
                </ProtectedRoute>
              } />

              <Route path='/stats' element={
                <ProtectedRoute>
                  <Stats />
                </ProtectedRoute>
              } />

              <Route path='/bookmarks' element={
                <ProtectedRoute>
                  <Bookmark />
                </ProtectedRoute>
              } />

              <Route path='/bookmarks/study' element={
                <ProtectedRoute>
                  <BookmarkStudy />
                </ProtectedRoute>
              } />

              <Route path='/start' element={
                <ProtectedRoute>
                  <Start />
                </ProtectedRoute>
              } />

              <Route path='/study' element={
                <ProtectedRoute>
                  <FlashCard />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <TabBar />
    </AuthBannerProvider>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
