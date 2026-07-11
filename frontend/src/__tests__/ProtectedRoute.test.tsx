import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// authService mock
jest.mock('../services/authService', () => ({
  getTokenLocally: jest.fn(),
  getUserLocally: jest.fn(),
  isTokenExpired: jest.fn(),
  logout: jest.fn(),
  refreshTokenIfNeeded: jest.fn(),
}));

// useAuthBanner mock
const mockShow = jest.fn();
jest.mock('../contexts/AuthBannerContext', () => ({
  useAuthBanner: () => ({ show: mockShow }),
}));

import { getTokenLocally, getUserLocally, isTokenExpired, logout, refreshTokenIfNeeded } from '../services/authService';

const mockToken = getTokenLocally as jest.Mock;
const mockUser = getUserLocally as jest.Mock;
const mockExpired = isTokenExpired as jest.Mock;

const renderWithRouter = (initialPath = '/protected') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>보호된 콘텐츠</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>로그인 페이지</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProtectedRoute', () => {
  it('토큰이 없으면 /login으로 리다이렉트', () => {
    mockToken.mockReturnValue(null);
    mockUser.mockReturnValue({ name: '유저' });
    mockExpired.mockReturnValue(false);

    renderWithRouter();

    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
    expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument();
  });

  it('유저 정보가 없으면 /login으로 리다이렉트', () => {
    mockToken.mockReturnValue('valid-token');
    mockUser.mockReturnValue(null);
    mockExpired.mockReturnValue(false);

    renderWithRouter();

    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
  });

  it('토큰이 만료되면 /login으로 리다이렉트하고 logout과 show() 호출', () => {
    mockToken.mockReturnValue('expired-token');
    mockUser.mockReturnValue({ name: '유저' });
    mockExpired.mockReturnValue(true);

    renderWithRouter();

    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
    expect(logout).toHaveBeenCalledWith(true);
    expect(mockShow).toHaveBeenCalledTimes(1);
  });

  it('유효한 토큰과 유저가 있으면 children 렌더링 후 refreshTokenIfNeeded 호출', () => {
    mockToken.mockReturnValue('valid-token');
    mockUser.mockReturnValue({ name: '유저' });
    mockExpired.mockReturnValue(false);

    renderWithRouter();

    expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument();
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument();
    expect(refreshTokenIfNeeded).toHaveBeenCalled();
  });

  it('만료 시 show()는 한 번만 호출되고 refreshTokenIfNeeded는 호출되지 않는다', () => {
    mockToken.mockReturnValue('expired-token');
    mockUser.mockReturnValue({ name: '유저' });
    mockExpired.mockReturnValue(true);

    renderWithRouter();

    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(refreshTokenIfNeeded).not.toHaveBeenCalled();
  });
});
