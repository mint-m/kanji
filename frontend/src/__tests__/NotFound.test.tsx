import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import store from 'store';
import NotFound from '../pages/NotFound';

// 컴포넌트 파일에서 vanilla-extract style()을 부르면 렌더 시 예외가 나 404가 오류 화면이 됐다
test('404 화면이 오류 없이 렌더링된다', () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    </Provider>
  );
  expect(screen.getByText('요청하신 페이지를 찾을 수 없어요.')).toBeInTheDocument();
});
