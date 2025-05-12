import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { PKCE_AUTH_CONFIG } from '@config/oauth2_config';
import { OAuthService, LoginOptions, OAuthErrorEvent } from 'angular-oauth2-oidc';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

@Injectable({
  providedIn: 'root'
})
export class AuthOauth2Service {

  private isAuthenticatedSubject$ = new BehaviorSubject<boolean>(false);


  constructor(private oauthService: OAuthService) {
    this.oauthService.configure(PKCE_AUTH_CONFIG);
    this.oauthService.setStorage(localStorage);
    this.oauthService.events.subscribe(event => {
      if (event instanceof OAuthErrorEvent) {
        console.error('OAuthErrorEvent Object:', event);
      } else {
        console.warn('OAuthEvent Object:', event);
      }
    });
    this.oauthService.events.subscribe(_ => {
      this.isAuthenticatedSubject$.next(this.oauthService.hasValidAccessToken());
    });
    this.isAuthenticatedSubject$.next(this.oauthService.hasValidAccessToken());
  }

  initCodeFlow(): void {
    this.oauthService.initCodeFlow(); // 启动授权码登录流程
  }
  logout(): void {
    this.oauthService.logOut(); // 登出
  }
  get isAuthenticated(): boolean {
    return this.oauthService.hasValidAccessToken(); // 检查访问令牌是否有效
  }

  accessToken(): string {
    // 获取访问令牌
    return this.oauthService.getAccessToken();
  }

  tryLogin(options?: LoginOptions): Observable<boolean> {
    return fromPromise(this.oauthService.tryLogin(options));
  }
}
