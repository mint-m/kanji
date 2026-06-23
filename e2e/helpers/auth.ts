import { Page } from '@playwright/test';

// Mock JWT with exp far in the future (valid for isTokenExpired check)
export const MOCK_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJ1c2VySWQiOiJ0ZXN0MTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidHlwZSI6Imdvb2dsZSIsImV4cCI6OTk5OTk5OTk5OX0' +
  '.mock_signature';

export const MOCK_USER = {
  _id: 'test123',
  email: 'test@example.com',
  name: '테스트 유저',
  type: 'google',
  activeProgressType: 'main',
};

/** localStorage에 mock 인증 상태를 주입하는 init 스크립트 */
export async function injectMockAuth(page: Page) {
  await page.addInitScript(
    ({ token, user }: { token: string; user: object }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token: MOCK_TOKEN, user: MOCK_USER },
  );
}
