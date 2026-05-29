import { http, HttpResponse } from 'msw';

import { mockApiSyncCount } from '@app/pages/system/test/api/mock/api-sync.mock';

export const rbacTestApiSync = [
  http.post('/site/api/rbac/api/sync', async () => {
    const count = mockApiSyncCount();
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: count });
  })
];
