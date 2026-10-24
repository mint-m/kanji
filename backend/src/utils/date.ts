// 학습일 판단은 한국 시간 기준이다 — 서버(Render)는 UTC라 toDateString()으로 비교하면 오전 9시에 날짜가 바뀐다
const kstDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 한국 시간 기준 날짜 'YYYY-MM-DD' */
export const toKstDate = (date: Date = new Date()): string => kstDateFormat.format(date);

/** 두 'YYYY-MM-DD' 날짜 사이의 일수 (to - from) */
export const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
