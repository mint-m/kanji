import { FC } from 'react';
import { startKakaoAuth } from 'services/kakaoOAuth';
import * as styles from '../loginButton.css';

interface KakaoLoginButtonProps {
  className?: string;
}

const KakaoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#191919"
      d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.632 5.076 4.1 6.48L5.1 21l4.484-2.96A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"
    />
  </svg>
);

const KakaoLoginButton: FC<KakaoLoginButtonProps> = ({ className }) => (
  <button
    className={`${styles.kakao}${className ? ` ${className}` : ''}`}
    onClick={() => startKakaoAuth('login')}
    type="button"
  >
    <KakaoIcon />
    카카오 로그인
  </button>
);

export default KakaoLoginButton;
