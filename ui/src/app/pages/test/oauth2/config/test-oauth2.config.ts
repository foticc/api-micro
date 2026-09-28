import { environment } from '@env/environment';
import { AuthConfig } from 'angular-oauth2-oidc';

/** OAuth2/OIDC 配置项，按 IdP 实际信息修改 */
export interface TestOAuth2Settings {
  enabled: boolean;
  /** 浏览器访问的 issuer（用于拉取 .well-known/openid-configuration） */
  issuer: string;
  clientId: string;
  scope: string;
  /** OAuth 回调路径（无 hash），与 IdP redirectUris 中的 path 一致 */
  redirectPath: string;
  /**
   * 与 Spring RegisteredClient.redirectUris 完全一致（字节级匹配）。
   * 留空则自动拼接为 origin + redirectPath（不含 #）。
   */
  redirectUri?: string;
  /**
   * 显式指定 origin（不含 path），与 redirectPath 拼接。
   * 例：http://spring-oauth-client:4200
   */
  redirectOrigin?: string;
  /**
   * Discovery 文档里若返回内网域名（如 spring-oauth-server:8000），
   * 重写为浏览器可访问的地址（如 http://127.0.0.1:9000）
   */
  endpointRewriteFrom?: string;
  endpointRewriteTo?: string;
}

export const TEST_OAUTH2_SETTINGS: TestOAuth2Settings = {
  enabled: true,
  issuer: 'http://127.0.0.1:9000',
  clientId: 'public-client',
  scope: 'openid profile email',
  redirectPath: '/login/oauth-callback',
  endpointRewriteFrom: 'http://spring-oauth-server:8000',
  endpointRewriteTo: 'http://127.0.0.1:9000'
};

/** redirect_uri = origin + redirectPath，不含 #（Spring SAS 字节级匹配） */
export function buildTestOAuth2RedirectUri(settings: TestOAuth2Settings = TEST_OAUTH2_SETTINGS): string {
  if (settings.redirectUri) {
    return settings.redirectUri.replace(/\/$/, '');
  }

  const path = settings.redirectPath.startsWith('/') ? settings.redirectPath : `/${settings.redirectPath}`;

  if (settings.redirectOrigin) {
    return `${settings.redirectOrigin.replace(/\/$/, '')}${path}`;
  }

  const { protocol, hostname, port } = window.location;
  const host = hostname === 'localhost' ? '127.0.0.1' : hostname;
  const portPart = port ? `:${port}` : '';
  return `${protocol}//${host}${portPart}${path}`;
}

export function buildTestOAuth2AuthConfig(settings: TestOAuth2Settings = TEST_OAUTH2_SETTINGS): AuthConfig {
  const redirectUri = buildTestOAuth2RedirectUri(settings);

  return new AuthConfig({
    issuer: settings.issuer,
    clientId: settings.clientId,
    redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/#/login/login-form`,
    responseType: 'code',
    scope: settings.scope,
    oidc: true,
    showDebugInformation: !environment.production,
    requireHttps: false,
    disablePKCE: false,
    clearHashAfterLogin: false,
    strictDiscoveryDocumentValidation: false,
    skipIssuerCheck: true
  });
}
