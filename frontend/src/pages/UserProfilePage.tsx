import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'store';
import UserProgress from 'components/UserProgress';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';
import { setActiveProgressType } from 'store/modules/user';
import { updateActiveProgressType, getProfile } from 'services/userService';
import { logout } from 'services/authService';
import { api } from 'services/apiClient';
import { ApiResponse, CurrentDeck } from 'services/types';

interface UserProfileProps { }

const UserProfilePage: React.FC<UserProfileProps> = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingSession, setIsUpdatingSession] = useState<boolean>(false);
  const [progressData, setProgressData] = useState<CurrentDeck | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState<boolean>(false);

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

          const profile = await getProfile();
          setUserData(profile);
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

  // Fetch current learning progress from UserProgress API
  useEffect(() => {
    const fetchProgress = async () => {
      if (!activeProgressType) {
        setProgressData(null);
        return;
      }

      setIsLoadingProgress(true);
      try {
        const response = await api.get<ApiResponse<CurrentDeck>>(
          `/api/users/me/progress/${activeProgressType}/current`
        );

        if (response.success && response.data) {
          setProgressData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch progress data:', error);
        // Silent fail - progress section will show fallback message
      } finally {
        setIsLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [activeProgressType]);

  const handleSessionToggle = async (type: 'main' | 'sub') => {
    if (isUpdatingSession || type === activeProgressType) return;

    setIsUpdatingSession(true);
    try {
      await updateActiveProgressType(type);
      dispatch(setActiveProgressType(type));

      // Update localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.activeProgressType = type;
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
    } catch (error) {
      console.error('Failed to update session type:', error);
      setError('세션 전환에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUpdatingSession(false);
    }
  };

  const handleLogout = () => {
    logout(true);
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
        <SectionTitle>Learning Session</SectionTitle>
        <SessionToggleContainer>
          <SessionButton
            active={activeProgressType === 'main'}
            onClick={() => handleSessionToggle('main')}
            disabled={isUpdatingSession}
          >
            Main
          </SessionButton>
          <SessionButton
            active={activeProgressType === 'sub'}
            onClick={() => handleSessionToggle('sub')}
            disabled={isUpdatingSession}
          >
            Sub
          </SessionButton>
        </SessionToggleContainer>

        <SectionTitle>Current Learning</SectionTitle>
        {isLoadingProgress ? (
          <LoadingProgress>Loading progress...</LoadingProgress>
        ) : progressData ? (
          <CurrentProgress>
            <ProgressItem>
              <ProgressLabel>Level</ProgressLabel>
              <ProgressValue>{progressData.level || 'N/A'}</ProgressValue>
            </ProgressItem>
            <ProgressItem>
              <ProgressLabel>Steps</ProgressLabel>
              <ProgressValue>
                {progressData.steps ? `${progressData.steps.start} - ${progressData.steps.end}` : 'N/A'}
              </ProgressValue>
            </ProgressItem>
          </CurrentProgress>
        ) : (
          <NoProgressMessage>
            No active learning session. Start by selecting a level!
          </NoProgressMessage>
        )}

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
        <UserProgress />
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

const SessionToggleContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

interface SessionButtonProps {
  active: boolean;
}

const SessionButton = styled.button<SessionButtonProps>`
  flex: 1;
  padding: 0.8rem 1.5rem;
  border: 2px solid ${props => props.active ? '#3498db' : '#ddd'};
  background-color: ${props => props.active ? '#3498db' : 'white'};
  color: ${props => props.active ? 'white' : '#666'};
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: #3498db;
    background-color: ${props => props.active ? '#2980b9' : '#e8f4f8'};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const LoadingProgress = styled.div`
  padding: 1rem;
  color: #7f8c8d;
  font-style: italic;
`;

const NoProgressMessage = styled.div`
  padding: 1rem;
  color: #95a5a6;
  font-style: italic;
  margin-bottom: 1.5rem;
`;