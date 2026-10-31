import { FC } from 'react';
import { clsx } from 'clsx';
import * as styles from './StudyHeatmap.css';

interface StudyHeatmapProps {
  activity: { date: string; count: number }[];
  today: string; // 한국 시간 'YYYY-MM-DD'
  goal: number;
}

const WEEKS = 16;
const DAY = 86_400_000;
const WEEKDAYS = '월화수목금토일';

// 날짜 문자열을 UTC 자정으로 다뤄 날짜 계산만 한다 — 기기 시간대와 무관하게 서버가 준 한국 날짜를 따른다
const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`);
const toDate = (time: number) => new Date(time).toISOString().slice(0, 10);
const weekdayOf = (time: number) => (new Date(time).getUTCDay() + 6) % 7; // 월요일 0

// 하루 목표 대비 농도 — 0 안 함 · 1 절반 미만 · 2 목표 미만 · 3 목표 달성
const levelOf = (count: number, goal: number): 0 | 1 | 2 | 3 =>
  count === 0 ? 0 : count < goal / 2 ? 1 : count < goal ? 2 : 3;

const dayLabel = (time: number, count: number) => {
  const date = new Date(time);
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 (${WEEKDAYS[weekdayOf(time)]}) · ${count}장`;
};

// 홈의 학습 잔디 — 최근 16주. 열은 주(월~일), 칸은 그날 답한 카드 수
const StudyHeatmap: FC<StudyHeatmapProps> = ({ activity, today, goal }) => {
  const counts = new Map(activity.map((day) => [day.date, day.count]));
  const end = toTime(today);
  const start = end - (weekdayOf(end) + (WEEKS - 1) * 7) * DAY;
  const days = Array.from({ length: (end - start) / DAY + 1 }, (_, index) => {
    const time = start + index * DAY;
    return { time, count: counts.get(toDate(time)) ?? 0 };
  });
  const studied = days.filter((day) => day.count > 0).length;
  const reached = days.filter((day) => day.count >= goal).length;

  // 달이 바뀐 주에 달 이름을 단다 — 첫 주의 이름은 다음 달 이름과 붙으면 뺀다
  const months = Array.from({ length: WEEKS }, (_, week) => new Date(start + week * 7 * DAY).getUTCMonth())
    .map((month, week, all) => ({ week, month, changed: week === 0 || month !== all[week - 1] }))
    .filter((entry) => entry.changed);
  if (months.length > 1 && months[1].week < 3) months.shift();

  return (
    <section className={styles.heatmap} aria-label="학습 잔디">
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `1.25rem repeat(${WEEKS}, 12px)` }}
        role="img"
        aria-label={`최근 ${WEEKS}주 중 ${studied}일 학습, 하루 목표 달성 ${reached}일`}
      >
        {months.map(({ week, month }) => (
          <span key={week} className={styles.month} style={{ gridColumn: `${week + 2} / span 4` }}>{month + 1}월</span>
        ))}
        {['월', '수', '금'].map((text, index) => (
          <span key={text} className={styles.weekday} style={{ gridRow: index * 2 + 2 }}>{text}</span>
        ))}
        {days.map(({ time, count }, index) => (
          <span
            key={time}
            className={clsx(styles.level[levelOf(count, goal)], time === end && styles.today)}
            style={{ gridColumn: Math.floor(index / 7) + 2, gridRow: (index % 7) + 2 }}
            title={dayLabel(time, count)}
          />
        ))}
      </div>

      <div className={styles.summary}>
        <p className={styles.figure}><span className={styles.value}>{studied}일</span> 학습한 날</p>
        <p className={styles.figure}><span className={styles.value}>{reached}일</span> 목표 달성</p>
        <span className={styles.legend} title={`하루 목표 ${goal}장 대비`} aria-hidden="true">
          적음
          {([0, 1, 2, 3] as const).map((level) => <span key={level} className={styles.level[level]} />)}
          많음
        </span>
      </div>
    </section>
  );
};

export default StudyHeatmap;
