
import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from 'components/Navbar';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from 'styles/GlobalStyle';
import { darkTheme, lightTheme } from './styles/theme';
import ProtectedRoute from 'ProtectedRoute';

const Main = lazy(() => import('pages/Main'));
const NotFound = lazy(() => import('pages/NotFound'));
const Login = lazy(() => import('pages/Login'));
const SelectLevel = lazy(() => import('pages/LevelSelectionPage'));
const FlashCard = lazy(() => import('pages/FlashCardPage'));

const App = () => {
  const [isDarkMode, setDarkMode] = useState<boolean>(false);

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <GlobalStyle />
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<Main />}>
          <Routes>
            <Route path='/' element={<Main />} />
            <Route path='/login' element={<Login />} />
            {/* <Route element={<ProtectedRoute />}>
              <Route path='/select-level' element={<SelectLevel />} />
              <Route path='/flash-cards' element={<FlashCard />} />
            </Route> */}
            <Route path='/select-level' element={<ProtectedRoute><SelectLevel /></ProtectedRoute>} />
            <Route path='/flash-cards' element={<ProtectedRoute><FlashCard /></ProtectedRoute>} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider >
  );
}

export default App;
