import { render, screen } from '@testing-library/react';
import StudyHeatmap from '../components/StudyHeatmap';
import * as styles from '../components/StudyHeatmap/StudyHeatmap.css';

// 2026-10-31은 토요일 — 16주 전 월요일(7월 13일)부터 오늘까지 111칸
const TODAY = '2026-10-31';
const cells = () => screen.getAllByTitle(/· \d+장$/);

describe('StudyHeatmap', () => {
  it('최근 16주를 월요일부터 오늘까지 주 단위 열로 그린다', () => {
    render(<StudyHeatmap activity={[]} today={TODAY} goal={30} />);
    expect(cells()).toHaveLength(111);
    expect(cells()[0]).toHaveAttribute('title', '7월 13일 (월) · 0장');
    expect(cells()[110]).toHaveAttribute('title', '10월 31일 (토) · 0장');
    expect(cells()[110]).toHaveClass(styles.today);
    expect(screen.getByText('7월')).toBeInTheDocument();
    expect(screen.getByText('10월')).toBeInTheDocument();
  });

  it('하루 목표 대비로 칸을 진하게 하고, 학습한 날·목표 달성한 날을 센다', () => {
    render(
      <StudyHeatmap
        activity={[{ date: '2026-10-28', count: 10 }, { date: '2026-10-29', count: 20 }, { date: '2026-10-30', count: 30 }]}
        today={TODAY}
        goal={30}
      />
    );
    expect(screen.getByTitle('10월 27일 (화) · 0장')).toHaveClass(styles.level[0]);
    expect(screen.getByTitle('10월 28일 (수) · 10장')).toHaveClass(styles.level[1]);
    expect(screen.getByTitle('10월 29일 (목) · 20장')).toHaveClass(styles.level[2]);
    expect(screen.getByTitle('10월 30일 (금) · 30장')).toHaveClass(styles.level[3]);
    expect(screen.getByRole('img', { name: '최근 16주 중 3일 학습, 하루 목표 달성 1일' })).toBeInTheDocument();
  });

  it('16주보다 오래된 기록은 그리지 않는다', () => {
    render(<StudyHeatmap activity={[{ date: '2026-07-12', count: 40 }]} today={TODAY} goal={30} />);
    expect(screen.queryByTitle(/7월 12일/)).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '최근 16주 중 0일 학습, 하루 목표 달성 0일' })).toBeInTheDocument();
  });
});
