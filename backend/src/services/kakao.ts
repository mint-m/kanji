import axios from 'axios';
import config from '../config';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
    };
  };
}

export const getKakaoAccessToken = async (code: string, redirectUri: string): Promise<string> => {
  const response = await axios.post<KakaoTokenResponse>(
    'https://kauth.kakao.com/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.KAKAO_REST_API_KEY,
      redirect_uri: redirectUri,
      code,
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  if (!response.data.access_token) {
    throw new Error('Failed to get Kakao access token');
  }

  return response.data.access_token;
};

export const getKakaoUserInfo = async (accessToken: string): Promise<{ kakaoId: string; email: string; name: string }> => {
  const response = await axios.get<KakaoUserInfo>('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const kakaoId = String(response.data.id);
  const email = response.data.kakao_account?.email ?? `kakao_${kakaoId}@kakao.local`;
  const name = response.data.kakao_account?.profile?.nickname || email.split('@')[0];

  return { kakaoId, email, name };
};
