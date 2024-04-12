import axios from 'axios';

const API_URL = `http://localhost:8000/auth`;

export const loginWithGoogle = (tokenId: string) => {
    return axios.post(`${API_URL}/google-login`, { tokenId });
};

export const saveTokenLocally = (token: string) => {
    localStorage.setItem('token', token);
};

export const getTokenLocally = () => {
    return localStorage.getItem('token');
};

export const requestUserInfoAndStoreLocally = async (token: string) => {
    try {
      // Make a GET request to the /auth/user_info endpoint, passing the JWT token in the Authorization header
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${JSON.stringify(token)}`
        }
      });
  
      // Store user information in local storage
      localStorage.setItem('profile', JSON.stringify(response.data));      
    } catch (error) {
      console.error('Error requesting user information:', error);
      // Handle error as needed
    }
  };