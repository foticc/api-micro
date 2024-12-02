import { AuthConfig } from 'angular-oauth2-oidc';

export const PKCE_AUTH_CONFIG: AuthConfig = {
  issuer: 'http://127.0.0.1:9000',
  loginUrl: 'http://127.0.0.1:9000/oauth2/authorize',
  clientId: 'public-client',
  redirectUri: 'http://127.0.0.1:4201/login/callback',
  responseType: 'code',
  scope: 'openid profile email',
  tokenEndpoint: 'http://127.0.0.1:9000/oauth2/token',
  postLogoutRedirectUri: 'http://127.0.0.1:4201/',
  userinfoEndpoint: 'http://127.0.0.1:9000/userinfo',
  requireHttps: false,
  showDebugInformation: true,
  logoutUrl: 'http://127.0.0.1:9000/connect/logout'
};
