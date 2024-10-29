import { delay, http, HttpResponse } from 'msw';

const content = [
  {
    id: '3eacac0e-0de9-4727-9a64-6bdd4be2ee1f',
    clientId: 'oidc-client',
    clientIdIssuedAt: '2023-07-12T07:33:42Z',
    clientSecret: '{bcrypt}$2a$10$JtXSCZ0U0sxLx0neymaYGeqOfiRBvIzga8XxsE1P8qxAqEwRyDotO',
    clientSecretExpiresAt: null,
    clientName: '3eacac0e-0de9-4727-9a64-6bdd4be2ee1f',
    clientAuthenticationMethods: 'client_secret_basic',
    authorizationGrantTypes: 'refresh_token,authorization_code',
    redirectUris: 'http://www.baidu.com',
    postLogoutRedirectUris: 'http://127.0.0.1:8080/',
    scopes: 'openid,profile',
    clientSettings: '{"@class":"java.util.Collections$UnmodifiableMap","settings.client.require-proof-key":false,"settings.client.require-authorization-consent":true}',
    tokenSettings:
      '{"@class":"java.util.Collections$UnmodifiableMap","settings.token.reuse-refresh-tokens":true,"settings.token.id-token-signature-algorithm":["org.springframework.security.oauth2.jose.jws.SignatureAlgorithm","RS256"],"settings.token.access-token-time-to-live":["java.time.Duration",300.000000000],"settings.token.access-token-format":{"@class":"org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat","value":"self-contained"},"settings.token.refresh-token-time-to-live":["java.time.Duration",3600.000000000],"settings.token.authorization-code-time-to-live":["java.time.Duration",300.000000000],"settings.token.device-code-time-to-live":["java.time.Duration",300.000000000]}'
  },
  {
    id: '3eacac0e-0de9-4727-9a64-6bdd4be2ee1g',
    clientId: 'client-id-test',
    clientIdIssuedAt: '2023-07-12T07:33:42Z',
    clientSecret: '{bcrypt}$2a$10$jp9IMiYLW.AsFrq7ohWru.19SCca2V.N8T6dDYvNh.EXzpQkAc/Mm',
    clientSecretExpiresAt: null,
    clientName: '测试',
    clientAuthenticationMethods: 'client_secret_basic',
    authorizationGrantTypes: 'refresh_token,authorization_code',
    redirectUris: 'http://127.0.0.1:9001/login/oauth2/code/messaging-client-oidc,http://127.0.0.1:9001/token',
    postLogoutRedirectUris: 'http://192.168.160.128:8888',
    scopes: 'openid,profile',
    clientSettings: '{"@class":"java.util.Collections$UnmodifiableMap","settings.client.require-proof-key":false,"settings.client.require-authorization-consent":true}',
    tokenSettings:
      '{"@class":"java.util.Collections$UnmodifiableMap","settings.token.reuse-refresh-tokens":true,"settings.token.id-token-signature-algorithm":["org.springframework.security.oauth2.jose.jws.SignatureAlgorithm","RS256"],"settings.token.access-token-time-to-live":["java.time.Duration",300.000000000],"settings.token.access-token-format":{"@class":"org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat","value":"self-contained"},"settings.token.refresh-token-time-to-live":["java.time.Duration",3600.000000000],"settings.token.authorization-code-time-to-live":["java.time.Duration",300.000000000],"settings.token.device-code-time-to-live":["java.time.Duration",300.000000000]}'
  },
  {
    id: 'd84e9e7c-abb1-46f7-bb0f-4511af362ca5',
    clientId: 'device-client-id',
    clientIdIssuedAt: '2023-07-15T16:34:15Z',
    clientSecret: '{bcrypt}$2a$10$kumRFUMRcmb.CO85L70azOq1pgsr3oKZm1Z19P3Iop/ZDzYxTGy72',
    clientSecretExpiresAt: null,
    clientName: '智能设备',
    clientAuthenticationMethods: 'none,client_secret_basic',
    authorizationGrantTypes: 'refresh_token,urn:ietf:params:oauth:grant-type:device_code',
    redirectUris: '',
    postLogoutRedirectUris: '',
    scopes: 'message.read,message.write',
    clientSettings: '{"@class":"java.util.Collections$UnmodifiableMap","settings.client.require-proof-key":false,"settings.client.require-authorization-consent":false}',
    tokenSettings:
      '{"@class":"java.util.Collections$UnmodifiableMap","settings.token.reuse-refresh-tokens":true,"settings.token.id-token-signature-algorithm":["org.springframework.security.oauth2.jose.jws.SignatureAlgorithm","RS256"],"settings.token.access-token-time-to-live":["java.time.Duration",1800.000000000],"settings.token.access-token-format":{"@class":"org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat","value":"self-contained"},"settings.token.refresh-token-time-to-live":["java.time.Duration",3600.000000000],"settings.token.authorization-code-time-to-live":["java.time.Duration",1800.000000000],"settings.token.device-code-time-to-live":["java.time.Duration",1800.000000000]}'
  },
  {
    id: 'd84e9e7c-abb1-46f7-bb0f-4511af362ca6',
    clientId: 'password-client-id',
    clientIdIssuedAt: '2023-07-12T07:33:42Z',
    clientSecret: 'secret',
    clientSecretExpiresAt: null,
    clientName: '密码模式授权平台',
    clientAuthenticationMethods: 'client_secret_basic',
    authorizationGrantTypes: 'refresh_token,authorization_password',
    redirectUris: '',
    postLogoutRedirectUris: 'http://127.0.0.1:9000/',
    scopes: 'openid,profile',
    clientSettings: '{"@class":"java.util.Collections$UnmodifiableMap","settings.client.require-proof-key":false,"settings.client.require-authorization-consent":true}',
    tokenSettings:
      '{"@class":"java.util.Collections$UnmodifiableMap","settings.token.reuse-refresh-tokens":true,"settings.token.id-token-signature-algorithm":["org.springframework.security.oauth2.jose.jws.SignatureAlgorithm","RS256"],"settings.token.access-token-time-to-live":["java.time.Duration",3600.000000000],"settings.token.access-token-format":{"@class":"org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat","value":"self-contained"},"settings.token.refresh-token-time-to-live":["java.time.Duration",7200.000000000],"settings.token.authorization-code-time-to-live":["java.time.Duration",3600.000000000],"settings.token.device-code-time-to-live":["java.time.Duration",3600.000000000]}'
  },
  {
    id: 'd84e9e7c-abb1-46f7-bb0f-4511af362ca7',
    clientId: 'mobile-client-id',
    clientIdIssuedAt: '2023-07-12T07:33:42Z',
    clientSecret: 'secret',
    clientSecretExpiresAt: null,
    clientName: '手机验证码授权平台',
    clientAuthenticationMethods: 'client_secret_basic',
    authorizationGrantTypes: 'refresh_token,authorization_password,authorization_message',
    redirectUris: '',
    postLogoutRedirectUris: 'http://127.0.0.1:9000/',
    scopes: 'profile',
    clientSettings: '{"@class":"java.util.Collections$UnmodifiableMap","settings.client.require-proof-key":false,"settings.client.require-authorization-consent":true}',
    tokenSettings:
      '{"@class":"java.util.Collections$UnmodifiableMap","settings.token.reuse-refresh-tokens":true,"settings.token.id-token-signature-algorithm":["org.springframework.security.oauth2.jose.jws.SignatureAlgorithm","RS256"],"settings.token.access-token-time-to-live":["java.time.Duration",3600.000000000],"settings.token.access-token-format":{"@class":"org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat","value":"self-contained"},"settings.token.refresh-token-time-to-live":["java.time.Duration",7200.000000000],"settings.token.authorization-code-time-to-live":["java.time.Duration",3600.000000000],"settings.token.device-code-time-to-live":["java.time.Duration",3600.000000000]}'
  },
  {
    id: 'd84e9e7c-abb1-46f7-bb0f-4511af362ca8',
    clientId: 'client-msg',
    clientIdIssuedAt: '2024-03-13T15:36:57Z',
    clientSecret: '{bcrypt}$2a$10$OD8ETpzWf1m36OeLzmpDeegJF7gvYZhgs69lvPx1vQyUmwKdbhRSe',
    clientSecretExpiresAt: null,
    clientName: '15点35分',
    clientAuthenticationMethods: 'client_secret_basic',
    authorizationGrantTypes: 'password,refresh_token,authorization_code',
    redirectUris: 'http://spring-oauth-client:9001/token,http://spring-oauth-client:9001/login/oauth2/code/messaging-client-oidc',
    postLogoutRedirectUris: '',
    scopes: 'openid,profile,email',
    clientSettings: '{"@class":"java.util.Collections$UnmodifiableMap","settings.client.require-proof-key":false,"settings.client.require-authorization-consent":true}',
    tokenSettings:
      '{"@class":"java.util.Collections$UnmodifiableMap","settings.token.reuse-refresh-tokens":true,"settings.token.id-token-signature-algorithm":["org.springframework.security.oauth2.jose.jws.SignatureAlgorithm","RS256"],"settings.token.access-token-time-to-live":["java.time.Duration",300.000000000],"settings.token.access-token-format":{"@class":"org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat","value":"self-contained"},"settings.token.refresh-token-time-to-live":["java.time.Duration",3600.000000000],"settings.token.authorization-code-time-to-live":["java.time.Duration",300.000000000],"settings.token.device-code-time-to-live":["java.time.Duration",300.000000000]}'
  }
];

const clietsList = http.get('/site/api/client/manager/page', () => {
  return HttpResponse.json({
    code: 0,
    msg: 'success',
    data: {
      content: content,
      pageable: {
        pageNumber: 0,
        pageSize: 10,
        sort: [],
        offset: 0,
        paged: true,
        unpaged: false
      },
      last: true,
      totalElements: 6,
      totalPages: 1,
      size: 10,
      number: 0,
      sort: [],
      first: true,
      numberOfElements: 6,
      empty: false
    }
  });
});

const save = http.post('/site/api/client/manage/save', async params => {
  await delay(3000);
  return HttpResponse.json({
    code: 400,
    msg: 'error',
    data: content[0]
  });
});

const get = http.get('/site/api/client/manage/get', params => {
  const url = new URL(params.request.url);

  // Read the "id" URL query parameter using the "URLSearchParams" API.
  // Given "/product?id=1", "productId" will equal "1".
  const id = url.searchParams.get('id');

  const row = content.find(obj => id === obj.id);

  console.log(params);
  return HttpResponse.json({
    code: 0,
    msg: 'success',
    data: row
  });
});

const del = http.post('/site/api/client/manage/delete', params => {
  console.log(params.params['id']);
  return HttpResponse.json({
    code: 0,
    msg: 'success',
    data: true
  });
});

export const apis = [clietsList, save, get, del];
