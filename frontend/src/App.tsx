import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Navbar from 'components/Navbar';
import ProtectedRoute from './ProtectedRoute';
import LearningRoute from './LearningRoute';
import { setUser } from 'store/modules/user';
import { AuthBannerProvider } from 'contexts/AuthBannerContext';

const Main = lazy(() => import('pages/Main'));
const NotFound = lazy(() => import('pages/NotFound'));
const Login = lazy(() => import('pages/Login'));
const SelectLevel = lazy(() => import('pages/LevelSelectionPage'));
const FlashCard = lazy(() => import('pages/FlashCardPage'));
const UserProfile = lazy(() => import('pages/UserProfilePage'));
const Bookmark = lazy(() => import('pages/BookmarkPage'));

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        dispatch(setUser({
          isLoggin: true,
          loginStatusType: userData.type || 'google',
          email: userData.email,
          name: userData.name,
          activeProgressType: userData.activeProgressType || null,
        }));
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AuthBannerProvider>
        <Navbar />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path='/' element={<Main />} />
            <Route path='/login' element={<Login />} />
            <Route path='*' element={<NotFound />} />

            <Route path='/profile' element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />

            <Route path='/bookmark' element={
              <ProtectedRoute>
                <Bookmark />
              </ProtectedRoute>
            } />

            <Route path='/select-level' element={
              <ProtectedRoute>
                <SelectLevel />
              </ProtectedRoute>
            } />

            <Route path='/flash-cards' element={
              <LearningRoute>
                <FlashCard />
              </LearningRoute>
            } />
          </Routes>
        </Suspense>
      </AuthBannerProvider>
    </BrowserRouter>
  );
};

export default App;
