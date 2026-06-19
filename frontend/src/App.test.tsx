import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from 'store';
import App from './App';

jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGoogleLogin: jest.fn(),
  useGoogleOneTapLogin: jest.fn(),
}));

test('앱이 오류 없이 렌더링된다', () => {
  expect(() =>
    render(
      <Provider store={store}>
        <App />
      </Provider>
    )
  ).not.toThrow();
});
