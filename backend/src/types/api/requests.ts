export interface GoogleAuthCodeRequest {
  code: string;
  redirect_uri?: string;
}

export interface GoogleTokenLoginRequest {
  accessToken: string;
}
