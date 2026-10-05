import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import Navbar from 'components/Navbar';
import Brand from 'components/Brand/Brand';
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
const SelectLevel = lazy(() => import('pages/LevelSelectionPage'));
const FlashCard = lazy(() => import('pages/FlashCardPage'));
const UserProfile = lazy(() => import('pages/UserProfilePage'));
const Bookmark = lazy(() => import('pages/BookmarkPage'));
const BookmarkStudy = lazy(() => import('pages/BookmarkStudyPage'));
const LevelSetup = lazy(() => import('pages/LevelSetupPage'));
const Dashboard = lazy(() => import('pages/DashboardPage'));
const UserStats = lazy(() => import('pages/UserStatsPage'));

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
      <Brand />
      <Navbar />
      {/* 경로가 바뀌면 다시 시도하도록 key로 초기화한다 */}
      <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path='/' element={<Main />} />
            <Route path='/login' element={<Login />} />
            <Route path='/auth/kakao/callback' element={<KakaoOAuthCallback />} />
            <Route path='*' element={<NotFound />} />

            <Route path='/profile' element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />

            <Route path='/profile/stats' element={
              <ProtectedRoute>
                <UserStats />
              </ProtectedRoute>
            } />

            <Route path='/bookmark' element={
              <ProtectedRoute>
                <Bookmark />
              </ProtectedRoute>
            } />

            <Route path='/bookmark-study' element={
              <ProtectedRoute>
                <BookmarkStudy />
              </ProtectedRoute>
            } />

            <Route path='/select-level' element={
              <ProtectedRoute>
                <SelectLevel />
              </ProtectedRoute>
            } />

            <Route path='/dashboard' element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path='/level-setup' element={
              <ProtectedRoute>
                <LevelSetup />
              </ProtectedRoute>
            } />

            <Route path='/flash-cards' element={
              <ProtectedRoute>
                <FlashCard />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AuthBannerProvider>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
