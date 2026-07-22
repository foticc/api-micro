import type { AuthorizationDTO, ConsentDTO, RegisteredClientDTO } from '@app/pages/system/test/models/oauth2-admin.models';
import { http, HttpResponse } from 'msw';

let clients: RegisteredClientDTO[] = [
  {
    id: 'c1',
    clientId: 'public-client',
    clientName: '公开客户端',
    clientAuthenticationMethods: ['none'],
    authorizationGrantTypes: ['authorization_code', 'refresh_token'],
    redirectUris: ['http://spring-oauth-client:4200/login/oauth-callback'],
    scopes: ['openid', 'profile'],
    clientSettings: { requireProofKey: true, requireAuthorizationConsent: false }
  }
];

let authorizations: AuthorizationDTO[] = [
  {
    id: 'a1',
    registeredClientId: 'c1',
    principalName: 'admin',
    authorizationGrantType: 'authorization_code',
    authorizedScopes: ['openid', 'profile'],
    accessToken: { tokenValue: 'abcd****wxyz', issuedAt: new Date().toISOString(), invalidated: false }
  }
];

let consents: ConsentDTO[] = [
  {
    registeredClientId: 'c1',
    principalName: 'admin',
    authorities: ['openid', 'profile', 'SCOPE_openid']
  }
];

function pageResult<T>(list: T[], pageIndex: number, pageSize: number) {
  const start = (pageIndex - 1) * pageSize;
  const slice = list.slice(start, start + pageSize);
  return { pageIndex, pageSize, total: list.length, list: slice };
}

export const oauth2Admin = [
  http.post('/site/api/manage/oauth2/client/page', async ({ request }) => {
    const body = (await request.json()) as { pageIndex?: number; pageSize?: number; filters?: { clientId?: string; clientName?: string } };
    let list = [...clients];
    const f = body.filters;
    if (f?.clientId) {
      list = list.filter(c => c.clientId?.includes(f.clientId!));
    }
    if (f?.clientName) {
      list = list.filter(c => c.clientName?.includes(f.clientName!));
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: pageResult(list, body.pageIndex ?? 1, body.pageSize ?? 10) });
  }),
  http.get('/site/api/manage/oauth2/client/:id', ({ params }) => {
    const item = clients.find(c => c.id === params['id']);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),
  http.post('/site/api/manage/oauth2/client/create', async ({ request }) => {
    const body = (await request.json()) as RegisteredClientDTO;
    const item = { ...body, id: `c${Date.now()}` };
    clients.push(item);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item });
  }),
  http.put('/site/api/manage/oauth2/client/:id', async ({ params, request }) => {
    const body = (await request.json()) as RegisteredClientDTO;
    const idx = clients.findIndex(c => c.id === params['id']);
    if (idx >= 0) {
      clients[idx] = { ...clients[idx], ...body, id: String(params['id']) };
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: clients[idx] });
  }),
  http.post('/site/api/manage/oauth2/client/del', async ({ request }) => {
    const { ids } = (await request.json()) as { ids: string[] };
    clients = clients.filter(c => !ids.includes(c.id!));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/manage/oauth2/authorization/page', async ({ request }) => {
    const body = (await request.json()) as { pageIndex?: number; pageSize?: number; filters?: { principalName?: string } };
    let list = [...authorizations];
    if (body.filters?.principalName) {
      list = list.filter(a => a.principalName?.includes(body.filters!.principalName!));
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: pageResult(list, body.pageIndex ?? 1, body.pageSize ?? 10) });
  }),
  http.get('/site/api/manage/oauth2/authorization/:id', ({ params }) => {
    const item = authorizations.find(a => a.id === params['id']);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),
  http.post('/site/api/manage/oauth2/authorization/revoke/:id', ({ params }) => {
    authorizations = authorizations.filter(a => a.id !== params['id']);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),
  http.post('/site/api/manage/oauth2/authorization/del', async ({ request }) => {
    const { ids } = (await request.json()) as { ids: string[] };
    authorizations = authorizations.filter(a => !ids.includes(a.id!));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/manage/oauth2/consent/page', async ({ request }) => {
    const body = (await request.json()) as { pageIndex?: number; pageSize?: number };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: pageResult(consents, body.pageIndex ?? 1, body.pageSize ?? 10) });
  }),
  http.get('/site/api/manage/oauth2/consent/:clientId/:principalName', ({ params }) => {
    const item = consents.find(c => c.registeredClientId === params['clientId'] && c.principalName === params['principalName']);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),
  http.post('/site/api/manage/oauth2/consent/create', async ({ request }) => {
    const body = (await request.json()) as ConsentDTO;
    consents.push(body);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: body });
  }),
  http.put('/site/api/manage/oauth2/consent/:clientId/:principalName', async ({ params, request }) => {
    const body = (await request.json()) as ConsentDTO;
    const idx = consents.findIndex(c => c.registeredClientId === params['clientId'] && c.principalName === params['principalName']);
    if (idx >= 0) {
      consents[idx] = body;
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: body });
  }),
  http.post('/site/api/manage/oauth2/consent/del', async ({ request }) => {
    const { items } = (await request.json()) as { items: ConsentDTO[] };
    consents = consents.filter(c => !items.some(i => i.registeredClientId === c.registeredClientId && i.principalName === c.principalName));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  })
];
