import { AuthConfig } from 'angular-oauth2-oidc';

export const PKCE_AUTH_CONFIG: AuthConfig = {
  issuer: 'http://spring-oauth-server:8000',
  loginUrl: 'http://spring-oauth-server:8000/oauth2/authorize',
  clientId: 'public-client',
  redirectUri: 'http://spring-oauth-client:4201/callback',
  responseType: 'code',
  scope: 'openid profile email',
  tokenEndpoint: 'http://spring-oauth-server:8000/oauth2/token',
  postLogoutRedirectUri: 'http://spring-oauth-client:4201/',
  userinfoEndpoint: 'http://spring-oauth-server:8000/userinfo',
  requireHttps: false,
  showDebugInformation: true,
  logoutUrl: 'http://spring-oauth-server:8000/connect/logout'
};
