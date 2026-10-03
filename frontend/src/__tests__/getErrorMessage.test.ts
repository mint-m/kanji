import { AxiosError } from 'axios';
import { getErrorMessage } from '../services/apiClient';

const FALLBACK = '불러오는데 실패했습니다.';
const withStatus = (status: number) =>
  new AxiosError('request failed', 'ERR_BAD_RESPONSE', undefined, undefined, { status, data: {} } as any);

describe('getErrorMessage', () => {
  it('타임아웃 → 서버 응답 지연 안내', () => {
    expect(getErrorMessage(new AxiosError('timeout', 'ECONNABORTED'), FALLBACK)).toMatch(/응답이 늦어요/);
  });

  it('응답 없음 → 네트워크 연결 안내', () => {
    expect(getErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'), FALLBACK)).toMatch(/네트워크 연결/);
  });

  it('5xx → 서버 오류 안내', () => {
    expect(getErrorMessage(withStatus(503), FALLBACK)).toMatch(/서버 오류/);
  });

  it('4xx → 화면별 기본 문구 (영문 서버 메시지를 그대로 노출하지 않음)', () => {
    expect(getErrorMessage(withStatus(400), FALLBACK)).toBe(FALLBACK);
  });

  it('401 (apiClient가 변환한 오류) → 로그인 만료 안내', () => {
    expect(getErrorMessage(new AxiosError('Unauthorized', 'ERR_UNAUTHORIZED'), FALLBACK)).toMatch(/로그인이 만료/);
  });

  it('axios 오류가 아니면 기본 문구', () => {
    expect(getErrorMessage(new Error('boom'), FALLBACK)).toBe(FALLBACK);
  });
});
