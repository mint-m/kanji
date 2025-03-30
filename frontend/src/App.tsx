import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from 'components/Navbar';
import { GlobalStyle } from 'styles/GlobalStyle';
import { lightTheme } from './styles/theme';
import ProtectedRoute from './ProtectedRoute';
import LearningRoute from './LearningRoute';
import { ThemeProvider } from 'styled-components';

// Lazy load components for better performance
const Main = lazy(() => import('pages/Main'));
const NotFound = lazy(() => import('pages/NotFound'));
const Login = lazy(() => import('pages/Login'));
const SelectLevel = lazy(() => import('pages/LevelSelectionPage'));
const FlashCard = lazy(() => import('pages/FlashCardPage'));
const UserProfile = lazy(() => import('pages/UserProfilePage'));

const App = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalStyle />
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* 공개 라우트 */}
            <Route path='/' element={<Main />} />
            <Route path='/login' element={<Login />} />
            <Route path='*' element={<NotFound />} />
            
            {/* 인증 필요 라우트 */}
            <Route path='/profile' element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            
            {/* 인증 및 학습 체크포인트 체크 라우트 */}
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
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;