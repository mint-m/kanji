import { toKstDate, daysBetween } from '../utils/date';

describe('toKstDate', () => {
  it('한국 시간 기준 날짜를 돌려준다 — UTC 15:00 이후는 한국의 다음 날', () => {
    expect(toKstDate(new Date('2026-10-23T14:59:59Z'))).toBe('2026-10-23');
    expect(toKstDate(new Date('2026-10-23T15:00:00Z'))).toBe('2026-10-24');
  });
});

describe('daysBetween', () => {
  it('두 날짜 사이의 일수 (월·연 경계 포함)', () => {
    expect(daysBetween('2026-10-23', '2026-10-24')).toBe(1);
    expect(daysBetween('2026-10-24', '2026-10-24')).toBe(0);
    expect(daysBetween('2026-12-31', '2027-01-02')).toBe(2);
  });
});
