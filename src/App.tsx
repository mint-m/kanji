import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';

const Main = lazy(() => import('./pages/Main'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Regist = lazy(() => import('./pages/Regist'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Main />}>
        <Routes>
          <Route path='/' element={<Main />} />
          <Route path='/regist' element={<Regist />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
