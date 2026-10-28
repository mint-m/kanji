import { Component, ErrorInfo, ReactNode } from 'react';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import * as styles from './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// 렌더 예외나 배포 직후 lazy 청크 로드 실패로 앱 전체가 흰 화면이 되지 않도록 복구 화면을 보여준다
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <CenterDiv role="alert">
        <h2 className={styles.title}>문제가 발생했어요</h2>
        <p className={styles.message}>새로고침하면 대부분 해결돼요. 계속되면 잠시 후 다시 시도해주세요.</p>
        <DefaultButton onClick={() => window.location.reload()}>새로고침</DefaultButton>
      </CenterDiv>
    );
  }
}

export default ErrorBoundary;
