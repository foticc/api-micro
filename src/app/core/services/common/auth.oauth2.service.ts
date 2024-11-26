import { inject, Injectable } from '@angular/core';
import { filter } from 'rxjs/operators';

import { TokenKey, TokenPre } from '@config/constant';
import { WindowService } from '@core/services/common/window.service';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root'
})
export class AuthOauth2Service {
  pkceAuthConfig: AuthConfig = {
    issuer: 'http://127.0.0.1:9000',
    loginUrl: 'http://127.0.0.1:9000/oauth2/authorize',
    clientId: 'public-client',
    redirectUri: 'http://127.0.0.1:4201/callback',
    responseType: 'code',
    scope: 'openid profile email',
    tokenEndpoint: 'http://127.0.0.1:9000/oauth2/token',
    postLogoutRedirectUri: 'http://127.0.0.1:4201/',
    userinfoEndpoint: 'http://127.0.0.1:9000/userinfo',
    requireHttps: false,
    showDebugInformation: true,
    logoutUrl: 'http://127.0.0.1:9000/connect/logout'
  };

  private windowServe = inject(WindowService);

  constructor(private oauthService: OAuthService) {
    this.oauthService.configure(this.pkceAuthConfig);
    this.oauthService.setStorage(sessionStorage);
    this.oauthService.events.pipe(filter(e => ['token_received'].includes(e.type))).subscribe(e => {
      let token = this.oauthService.getAccessToken();
      this.windowServe.setSessionStorage(TokenKey, TokenPre + token);
    });
  }

  login(): void {
    this.oauthService.initCodeFlow(); // 启动授权码登录流程
    // this.oauthService.initLoginFlowInPopup().then(res=>{
    //   console.log(res);
    // }); // 启动弹出式登录流程
    // this.oauthService.tryLoginCodeFlow().then(res => {
    //   console.log(res);
    // });
    // this.oauthService.tryLoginCodeFlow()
    // this.oauthService.initLoginFlowInPopup().then(res => {
    //   console.log(res);
    // });
    this.oauthService.tryLoginCodeFlow()
  }
  logout(): void {
    // this.oauthService.revokeTokenAndLogout()
    // this.oauthService.revokeTokenAndLogout()
    //   .then(res=>{
    //     console.log(res);
    //     this.router.navigate(['/']);
    //   });
    this.oauthService.logOut(); // 登出
  }
  get isAuthenticated(): boolean {
    return this.oauthService.hasValidAccessToken(); // 检查访问令牌是否有效
  }

  userInfo(): any {
    this.oauthService.loadUserProfile().then(res => {
      console.log(' ', res);
    });
    return this.oauthService.getGrantedScopes(); // 获取用户信息 claims
  }

  accessToken(): string {
    // 获取访问令牌
    return this.oauthService.getAccessToken();
  }
}
