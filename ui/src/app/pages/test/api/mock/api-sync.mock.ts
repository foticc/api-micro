import { ApiSyncResult } from '@app/pages/test/api/models/api-sync.models';

export function mockApiSyncResult(): ApiSyncResult {
  return { created: 1, refreshed: 2, stale: 1 };
}
