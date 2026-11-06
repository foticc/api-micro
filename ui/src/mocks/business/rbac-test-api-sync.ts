import { mockApiSyncResult } from '@app/pages/test/api/mock/api-sync.mock';
import { http, HttpResponse } from 'msw';

export const rbacTestApiSync = [
  http.post('/site/api/rbac/api/sync', () => {
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: mockApiSyncResult() });
  })
];
