
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from 'components/Navbar';
import { GlobalStyle } from 'styles/GlobalStyle';
import { lightTheme } from './styles/theme';
import ProtectedRoute from 'ProtectedRoute';
import { ThemeProvider } from 'styled-components';

const Main = lazy(() => import('pages/Main'));
const NotFound = lazy(() => import('pages/NotFound'));
const Login = lazy(() => import('pages/Login'));
const SelectLevel = lazy(() => import('pages/LevelSelectionPage'));
const FlashCard = lazy(() => import('pages/FlashCardPage'));

const App = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalStyle />
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<Main />}>
          <Routes>
            <Route path='/' element={<Main />} />
            <Route path='/login' element={<Login />} />
            <Route path='/select-level' element={<ProtectedRoute><SelectLevel /></ProtectedRoute>} />
            <Route path='/flash-cards' element={<ProtectedRoute><FlashCard /></ProtectedRoute>} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
