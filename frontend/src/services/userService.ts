import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const updateActiveProgressType = async (
  activeProgressType: 'main' | 'sub' | null
): Promise<void> => {
  const token = localStorage.getItem('token');

  await axios.patch(
    `${API_BASE_URL}/api/users/me/active-progress-type`,
    { activeProgressType },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
