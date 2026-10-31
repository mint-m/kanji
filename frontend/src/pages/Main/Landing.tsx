import { FC } from 'react';
import { Link } from 'react-router-dom';
import GoogleLoginButton from 'components/LoginButton/GoogleLoginButton';
import KakaoLoginButton from 'components/LoginButton/KakaoLoginButton';
import * as layout from 'styles/layout.css';
import * as styles from './Landing.css';

const FEATURES = [
  { title: '범위로 익히기', text: '3스텝 묶음의 단어를 모두 알 때까지 — 모르는 단어만 다시 섞어 한 바퀴 더 돌아요.' },
  { title: '잊기 전에 복습', text: '알게 된 단어는 다음 날, 3일, 7일, 14일… 잊을 때쯤 오늘의 복습에 다시 나와요.' },
  { title: '막히면 바로 풀이', text: '한자를 누르면 음·훈과 뜻이, 스피커를 누르면 발음이 나와요. 키보드만으로도 넘길 수 있어요.' },
];

// 로그인 전 첫 화면 — 무엇을 하는 서비스인지 보여 주고 바로 시작하게 한다
const Landing: FC<{ error?: string }> = ({ error }) => (
  <div className={layout.page}>
    <section className={styles.hero}>
      <div>
        <p className={styles.eyebrow}>JLPT N5–N1</p>
        <h1 className={styles.title}>외운 단어를<br />오래 기억하는 일본어 단어장</h1>
        <p className={styles.lead}>
          3스텝씩 밀어 가는 범위 학습으로 익히고, 1·3·7일 간격 복습으로 굳혀요.
        </p>
        <div className={styles.buttons}>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <GoogleLoginButton />
          <KakaoLoginButton />
        </div>
      </div>
      <div className={styles.demo} aria-label="학습 카드 예시" role="img">
        <span className={styles.demoReading} lang="ja">がくせい</span>
        <span className={styles.demoWord} lang="ja">学生</span>
        <span className={styles.demoMean}>학생</span>
        <div className={styles.demoAnswers} aria-hidden="true">
          <span className={styles.demoUnknown}>몰라요</span>
          <span className={styles.demoKnow}>알아요</span>
        </div>
      </div>
    </section>

    <section className={styles.features} aria-label="학습 방법">
      {FEATURES.map((feature) => (
        <div key={feature.title} className={styles.feature}>
          <h2 className={styles.featureTitle}>{feature.title}</h2>
          <p className={styles.featureText}>{feature.text}</p>
        </div>
      ))}
    </section>

    <footer className={styles.footer}>
      <Link to="/sources">데이터 출처</Link>
    </footer>
  </div>
);

export default Landing;
