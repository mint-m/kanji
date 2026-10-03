import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

const Boom = () => {
  throw new Error('render failed');
};

describe('ErrorBoundary', () => {
  it('하위 컴포넌트가 렌더 중 예외를 던지면 흰 화면 대신 복구 화면을 보여준다', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('문제가 발생했어요');
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('예외가 없으면 자식을 그대로 렌더한다', () => {
    render(
      <ErrorBoundary>
        <p>정상 화면</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('정상 화면')).toBeInTheDocument();
  });
});
