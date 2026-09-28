import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';

import { LoginInOutService } from '@core/services/common/login-in-out.service';
import { OAuthService } from 'angular-oauth2-oidc';

import { buildTestOAuth2AuthConfig, TEST_OAUTH2_SETTINGS } from '../config/test-oauth2.config';
import { resolveOAuthErrorMessage } from '../utils/oauth-error.util';

type OAuthServiceInternals = OAuthService & {
  loginUrl?: string;
  logoutUrl?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
  jwksUri?: string;
  revocationEndpoint?: string;
};

@Service()
export class TestOAuth2Service {
  private oauthService = inject(OAuthService);
  private loginInOutService = inject(LoginInOutService);
  private router = inject(Router);

  constructor() {
    /** 兜底：确保 requireHttps 等选项在 OAuthService 上生效 */
    this.oauthService.configure(buildTestOAuth2AuthConfig());
  }

  isEnabled(): boolean {
    return TEST_OAUTH2_SETTINGS.enabled;
  }

  /** IdP 回调落在 origin/?code=... 时（无 hash），应用启动后自动换 token */
  async handleAuthorizationCallbackIfPresent(): Promise<void> {
    if (!this.isEnabled() || !new URLSearchParams(window.location.search).has('code')) {
      return;
    }

    try {
      await this.completeCallbackLogin();
      await this.router.navigateByUrl('/default/dashboard/analysis');
    } catch (err) {
      console.error('[OAuth2] 启动时处理授权回调失败', err);
      await this.router.navigateByUrl('/login/login-form');
    }
  }

  async ensureDiscoveryDocument(): Promise<void> {
    if (this.oauthService.discoveryDocumentLoaded) {
      return;
    }

    try {
      await this.oauthService.loadDiscoveryDocument();
      this.rewriteDiscoveryEndpoints();
    } catch (err) {
      throw new Error(resolveOAuthErrorMessage(err, 'OAuth2 Discovery 加载失败'));
    }
  }

  /** 发起授权码 + PKCE 登录 */
  async startLogin(): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('OAuth2 未启用');
    }

    await this.ensureDiscoveryDocument();

    if (!this.oauthService.loginUrl) {
      throw new Error('未获取到 authorization_endpoint，请检查 IdP Discovery 配置');
    }

    console.info('[OAuth2] redirect_uri =', this.oauthService.redirectUri);
    this.oauthService.initCodeFlow();
  }

  /** IdP 回调后完成登录并进入应用 */
  async completeCallbackLogin(): Promise<void> {
    try {
      await this.ensureDiscoveryDocument();
      await this.oauthService.tryLoginCodeFlow();
    } catch (err) {
      throw new Error(resolveOAuthErrorMessage(err, 'OAuth2 回调处理失败'));
    }

    if (!this.oauthService.hasValidAccessToken()) {
      throw new Error('OAuth2 未获取到有效 Token');
    }

    const token = this.oauthService.getAccessToken();
    if (!token) {
      throw new Error('OAuth2 Token 为空');
    }

    await this.loginInOutService.loginIn(token);
  }

  async logoutFromIdp(): Promise<void> {
    if (this.oauthService.hasValidAccessToken()) {
      this.oauthService.logOut();
    }
    await this.router.navigateByUrl('/login/login-form');
  }

  /** 将 Discovery 内网地址重写为浏览器可访问地址（Spring OAuth 常见场景） */
  private rewriteDiscoveryEndpoints(): void {
    const { endpointRewriteFrom, endpointRewriteTo } = TEST_OAUTH2_SETTINGS;
    if (!endpointRewriteFrom || !endpointRewriteTo) {
      return;
    }

    const from = endpointRewriteFrom.replace(/\/$/, '');
    const to = endpointRewriteTo.replace(/\/$/, '');
    const svc = this.oauthService as OAuthServiceInternals;

    const rewrite = (url?: string): string | undefined => {
      if (!url || !url.startsWith(from)) {
        return url;
      }
      return to + url.slice(from.length);
    };

    const assign = (key: keyof OAuthServiceInternals, url?: string) => {
      const next = rewrite(url);
      if (next) {
        svc[key] = next as never;
      }
    };

    assign('loginUrl', svc.loginUrl);
    assign('logoutUrl', svc.logoutUrl);
    assign('tokenEndpoint', svc.tokenEndpoint);
    assign('userinfoEndpoint', svc.userinfoEndpoint);
    assign('jwksUri', svc.jwksUri);
    assign('revocationEndpoint', svc.revocationEndpoint);
  }
}
