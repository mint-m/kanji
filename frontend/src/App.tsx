
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from 'components/Navbar';

const Main = lazy(() => import('pages/Main'));
const NotFound = lazy(() => import('pages/NotFound'));
const Login = lazy(() => import('pages/Login'));
const Regist = lazy(() => import('pages/Regist'));
const Stage = lazy(() => import('pages/Stage'));
const Study = lazy(() => import('pages/Study'));
const FlashCard = lazy(() => import('pages/FlashCard'));

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<Main />}>
        <Routes>
          <Route path='/' element={<Main />} />
          <Route path='/regist' element={<Regist />} />
          <Route path='/login' element={<Login />} />
          <Route path='/study' element={<Study />} />
          <Route path='/stage' element={<Stage />} />
          <Route path='/flash-cards' element={<FlashCard />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
