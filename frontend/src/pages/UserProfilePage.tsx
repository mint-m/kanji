import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import UserProgress from 'components/UserProgress';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import axios from 'axios';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {}

const UserProfilePage: React.FC<UserProfileProps> = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user data from local storage or API
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserData(userData);
        } else {
          // If not in local storage, try to fetch from API
          const token = localStorage.getItem('token');
          
          if (!token) {
            throw new Error('Not authenticated');
          }
          
          const response = await axios.get('/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          setUserData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setError('Failed to load your profile information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  if (isLoading) {
    return (
      <CenterDiv>
        <LoadingMessage>Loading your profile...</LoadingMessage>
      </CenterDiv>
    );
  }

  if (error || !userData) {
    return (
      <CenterDiv>
        <ErrorContainer>
          <h2>Error Loading Profile</h2>
          <p>{error || 'Failed to load profile data'}</p>
          <DefaultButton onClick={() => navigate('/login')}>
            Return to Login
          </DefaultButton>
        </ErrorContainer>
      </CenterDiv>
    );
  }

  return (
    <ProfileContainer>
      <ProfileHeader>
        <Avatar>
          {userData.name?.charAt(0) || userData.email.charAt(0)}
        </Avatar>
        <UserInfo>
          <h1>{userData.name || 'User'}</h1>
          <p>{userData.email}</p>
          <p>Account type: {userData.type}</p>
        </UserInfo>
      </ProfileHeader>
      
      <LearningSection>
        <SectionTitle>Current Learning</SectionTitle>
        <CurrentProgress>
          <ProgressItem>
            <ProgressLabel>Level</ProgressLabel>
            <ProgressValue>{user.learningCheckpoint.level}</ProgressValue>
          </ProgressItem>
          <ProgressItem>
            <ProgressLabel>Steps</ProgressLabel>
            <ProgressValue>
              {user.learningCheckpoint.step.min} - {user.learningCheckpoint.step.max}
            </ProgressValue>
          </ProgressItem>
        </CurrentProgress>
        
        <ButtonGroup>
          <ActionButton onClick={() => navigate('/select-level')}>
            학습 단계 변경
          </ActionButton>
          <ActionButton onClick={() => navigate('/flash-cards')}>
            학습 이어하기
          </ActionButton>
        </ButtonGroup>
      </LearningSection>
      
      <StatsSection>
        <SectionTitle>Learning Progress</SectionTitle>
        <UserProgress userId={userData._id} />
      </StatsSection>
      
      <AccountSection>
        <SectionTitle>Account</SectionTitle>
        <LogoutButton onClick={handleLogout}>
          Log Out
        </LogoutButton>
      </AccountSection>
    </ProfileContainer>
  );
};

export default UserProfilePage;

// Styled components
const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const LoadingMessage = styled.div`
  font-size: 1.2rem;
  color: #666;
`;

const ErrorContainer = styled.div`
  background-color: #fff0f0;
  padding: 2rem;
  border-radius: 0.5rem;
  text-align: center;
  max-width: 400px;
  
  h2 {
    color: #d32f2f;
    margin-top: 0;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  ${props => props.theme.outerShadow}
`;

const Avatar = styled.div`
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  margin-right: 1.5rem;
`;

const UserInfo = styled.div`
  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
  }
  
  p {
    margin: 0.3rem 0;
    color: #666;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: #2c3e50;
`;

const LearningSection = styled.section`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  ${props => props.theme.outerShadow}
`;

const StatsSection = styled.section`
  margin-bottom: 2rem;
`;

const AccountSection = styled.section`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  text-align: center;
  ${props => props.theme.outerShadow}
`;

const CurrentProgress = styled.div`
  display: flex;
  gap: 3rem;
  margin-bottom: 1.5rem;
`;

const ProgressItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProgressLabel = styled.span`
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 0.3rem;
`;

const ProgressValue = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const ActionButton = styled(DefaultButton)`
  flex: 1;
  padding: 0.8rem 1rem;
`;

const LogoutButton = styled(DefaultButton)`
  background-color: #f8f9fa;
  color: #d32f2f;
  
  &:hover {
    background-color: #f1f1f1;
  }
`;