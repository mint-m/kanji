// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom(Jest 27)에는 Web Crypto가 없다 — 카카오 OAuth state 생성(crypto.getRandomValues)을 위해 Node 구현을 붙인다
if (!window.crypto?.getRandomValues) {
  Object.defineProperty(window, 'crypto', { value: require('crypto').webcrypto });
}
