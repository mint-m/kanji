import { render, screen } from '@testing-library/react';
import SourcesPage from '../pages/SourcesPage';

// CC BY-SA 4.0 조건 — 앱 안의 별도 화면에서 출처·소유자·라이선스로 이어져야 한다
test('KANJIDIC2 출처와 EDRDG 라이선스 링크를 보여 준다', () => {
  render(<SourcesPage />);

  const KANJIDIC = 'https://www.edrdg.org/wiki/index.php/KANJIDIC_Project';
  expect(screen.getByRole('heading', { name: '데이터 출처' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'KANJIDIC2' })).toHaveAttribute('href', KANJIDIC);
  expect(screen.getByRole('link', { name: 'KANJIDIC' })).toHaveAttribute('href', KANJIDIC);
  expect(screen.getByRole('link', { name: 'licence' }))
    .toHaveAttribute('href', 'https://www.edrdg.org/edrdg/licence.html');
  expect(screen.getByRole('link', { name: 'Electronic Dictionary Research and Development Group' }))
    .toHaveAttribute('href', 'https://www.edrdg.org/');
});
