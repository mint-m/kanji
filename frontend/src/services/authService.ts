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
