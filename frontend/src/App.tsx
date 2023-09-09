
import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from 'components/Navbar';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from 'styles/GlobalStyle';
import { darkTheme, lightTheme } from './styles/theme';

const Main = lazy(() => import('pages/Main'));
const NotFound = lazy(() => import('pages/NotFound'));
const Login = lazy(() => import('pages/Login'));
const Regist = lazy(() => import('pages/Regist'));
const SelectLevel = lazy(() => import('pages/LevelSelectionPage'));
const FlashCard = lazy(() => import('pages/FlashCard'));

const App = () => {
  const [isDrkMode, setDarkMode] = useState<boolean>(false);

  return (
    <ThemeProvider theme={isDrkMode ? darkTheme : lightTheme}>
      <GlobalStyle />
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<Main />}>
          <Routes>
            <Route path='/' element={<Main />} />
            <Route path='/regist' element={<Regist />} />
            <Route path='/login' element={<Login />} />
            <Route path='/select-level' element={<SelectLevel />} />
            <Route path='/flash-cards' element={<FlashCard />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider >
  );
}

export default App;
