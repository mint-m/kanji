import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthBannerProvider, useAuthBanner } from '../contexts/AuthBannerContext';

// authBannerBridge mock: apiClient 브릿지 등록 부분은 테스트 불필요
jest.mock('../contexts/authBannerBridge', () => ({
  setAuthBannerTrigger: jest.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <AuthBannerProvider>{children}</AuthBannerProvider>
  </MemoryRouter>
);

describe('useAuthBanner', () => {
  it('Provider 없이 사용하면 에러를 던진다', () => {
    expect(() => {
      renderHook(() => useAuthBanner());
    }).toThrow('useAuthBanner must be used within AuthBannerProvider');
  });

  it('Provider 안에서 show 함수를 반환한다', () => {
    const { result } = renderHook(() => useAuthBanner(), { wrapper });
    expect(typeof result.current.show).toBe('function');
  });
});

describe('AuthBannerProvider', () => {
  it('초기 상태에서 배너가 보이지 않는다', () => {
    render(
      <MemoryRouter>
        <AuthBannerProvider>
          <div>콘텐츠</div>
        </AuthBannerProvider>
      </MemoryRouter>
    );
    expect(screen.queryByText(/세션이 만료/)).not.toBeInTheDocument();
  });

  it('show() 호출 시 세션 만료 배너가 표시된다', () => {
    const TestConsumer = () => {
      const { show } = useAuthBanner();
      return <button onClick={show}>만료 트리거</button>;
    };

    render(
      <MemoryRouter>
        <AuthBannerProvider>
          <TestConsumer />
        </AuthBannerProvider>
      </MemoryRouter>
    );

    act(() => {
      screen.getByText('만료 트리거').click();
    });

    expect(screen.getByText(/세션이 만료되었습니다/)).toBeInTheDocument();
  });
});
