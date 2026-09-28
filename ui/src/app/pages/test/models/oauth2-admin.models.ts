/** OAuth2 管理 API 模型，对应 api-auth 服务 DTO */

export interface OAuth2TokenSummary {
  tokenValue?: string;
  issuedAt?: string;
  expiresAt?: string;
  invalidated?: boolean;
}

export interface OAuth2ClientSettings {
  requireProofKey?: boolean;
  requireAuthorizationConsent?: boolean;
  jwkSetUrl?: string;
  tokenEndpointAuthenticationSigningAlgorithm?: string;
  x509CertificateSubjectDN?: string;
}

export interface OAuth2TokenSettings {
  authorizationCodeTimeToLive?: string;
  accessTokenTimeToLive?: string;
  accessTokenFormat?: string;
  deviceCodeTimeToLive?: string;
  reuseRefreshTokens?: boolean;
  refreshTokenTimeToLive?: string;
  idTokenSignatureAlgorithm?: string;
  x509CertificateBoundAccessTokens?: boolean;
}

export interface RegisteredClientDTO {
  id?: string;
  clientId: string;
  clientIdIssuedAt?: string;
  clientSecret?: string;
  clientSecretExpiresAt?: string;
  clientName?: string;
  clientAuthenticationMethods?: string[];
  authorizationGrantTypes?: string[];
  redirectUris?: string[];
  postLogoutRedirectUris?: string[];
  scopes?: string[];
  clientSettings?: OAuth2ClientSettings;
  tokenSettings?: OAuth2TokenSettings;
}

export interface RegisteredClientQueryFilter {
  clientId?: string;
  clientName?: string;
}

export interface AuthorizationDTO {
  id?: string;
  registeredClientId?: string;
  principalName?: string;
  authorizationGrantType?: string;
  authorizedScopes?: string[];
  state?: string;
  accessToken?: OAuth2TokenSummary;
  refreshToken?: OAuth2TokenSummary;
  authorizationCode?: OAuth2TokenSummary;
  idToken?: OAuth2TokenSummary;
}

export interface AuthorizationQueryFilter {
  registeredClientId?: string;
  principalName?: string;
  authorizationGrantType?: string;
}

export interface ConsentDTO {
  registeredClientId: string;
  principalName: string;
  authorities?: string[];
}

export interface ConsentQueryFilter {
  registeredClientId?: string;
  principalName?: string;
}

export interface ConsentKey {
  registeredClientId: string;
  principalName: string;
}

/** 表单用 */
export interface RegisteredClientFormValue {
  id?: string;
  clientId: string;
  clientName?: string;
  clientSecret?: string;
  clientAuthenticationMethods?: string[];
  authorizationGrantTypes?: string[];
  redirectUris?: string[];
  postLogoutRedirectUris?: string[];
  scopes?: string[];
  requireProofKey?: boolean;
  requireAuthorizationConsent?: boolean;
}

export interface ConsentFormValue {
  registeredClientId: string;
  principalName: string;
  authoritiesText?: string;
}

export function uniqueStrings(values?: string[]): string[] {
  if (!values?.length) {
    return [];
  }
  return [...new Set(values.map(s => s.trim()).filter(Boolean))];
}

export function linesToSet(text?: string): string[] {
  if (!text?.trim()) {
    return [];
  }
  return [
    ...new Set(
      text
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(Boolean)
    )
  ];
}

export function setToLines(values?: string[]): string {
  return values?.join('\n') ?? '';
}

export function toRegisteredClientDto(form: RegisteredClientFormValue): RegisteredClientDTO {
  return {
    id: form.id,
    clientId: form.clientId,
    clientName: form.clientName,
    clientSecret: form.clientSecret || undefined,
    clientAuthenticationMethods: form.clientAuthenticationMethods?.length ? form.clientAuthenticationMethods : ['none'],
    authorizationGrantTypes: form.authorizationGrantTypes?.length ? form.authorizationGrantTypes : ['authorization_code'],
    redirectUris: uniqueStrings(form.redirectUris),
    postLogoutRedirectUris: uniqueStrings(form.postLogoutRedirectUris),
    scopes: uniqueStrings(form.scopes),
    clientSettings: {
      requireProofKey: !!form.requireProofKey,
      requireAuthorizationConsent: !!form.requireAuthorizationConsent
    }
  };
}

export function toRegisteredClientForm(dto: RegisteredClientDTO): RegisteredClientFormValue {
  return {
    id: dto.id,
    clientId: dto.clientId,
    clientName: dto.clientName,
    clientAuthenticationMethods: dto.clientAuthenticationMethods ? [...dto.clientAuthenticationMethods] : ['none'],
    authorizationGrantTypes: dto.authorizationGrantTypes ? [...dto.authorizationGrantTypes] : ['authorization_code'],
    redirectUris: dto.redirectUris ? [...dto.redirectUris] : [],
    postLogoutRedirectUris: dto.postLogoutRedirectUris ? [...dto.postLogoutRedirectUris] : [],
    scopes: dto.scopes ? [...dto.scopes] : [],
    requireProofKey: dto.clientSettings?.requireProofKey ?? false,
    requireAuthorizationConsent: dto.clientSettings?.requireAuthorizationConsent ?? false
  };
}

export function toConsentDto(form: ConsentFormValue): ConsentDTO {
  return {
    registeredClientId: form.registeredClientId,
    principalName: form.principalName,
    authorities: linesToSet(form.authoritiesText)
  };
}

export function toConsentForm(dto: ConsentDTO): ConsentFormValue {
  return {
    registeredClientId: dto.registeredClientId,
    principalName: dto.principalName,
    authoritiesText: setToLines(dto.authorities)
  };
}
