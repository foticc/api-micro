import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';

import { AuthConfig, provideOAuthClient } from 'angular-oauth2-oidc';

import { buildTestOAuth2AuthConfig } from '../config/test-oauth2.config';
import { TestOAuth2Service } from '../services/test-oauth2.service';

export function provideTestOAuth2(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideOAuthClient(),
    /** OAuthService 构造函数注入的是 AuthConfig 类，不是 AUTH_CONFIG token */
    {
      provide: AuthConfig,
      useFactory: buildTestOAuth2AuthConfig
    },
    provideAppInitializer(() => {
      const oauth = inject(TestOAuth2Service);
      return oauth.handleAuthorizationCallbackIfPresent();
    })
  ]);
}
