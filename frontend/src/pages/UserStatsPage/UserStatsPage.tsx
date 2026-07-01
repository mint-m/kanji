import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProgress from 'components/UserProgress';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import * as styles from './UserStatsPage.css';

const UserStatsPage: FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <DefaultButton className={styles.backBtn} onClick={() => navigate('/profile')}>← 프로필</DefaultButton>
        <h1 className={styles.pageTitle}>학습 통계</h1>
      </div>
      <UserProgress />
    </div>
  );
};

export default UserStatsPage;
