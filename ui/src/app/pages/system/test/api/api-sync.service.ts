import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseHttpService } from '@services/base-http.service';

import { ApiSyncResponseData, ApiSyncRunResult } from './models/api-sync.models';

@Service()
export class ApiSyncService {
  private readonly http = inject(BaseHttpService);

  /** POST /rbac/api/sync — 后端完成对比与导入，返回同步数量 */
  runSync(): Observable<ApiSyncRunResult> {
    return this.http
      .post<ApiSyncResponseData>('/rbac/api/sync', {})
      .pipe(map(data => ({ created: this.parseSyncCount(data) })));
  }

  private parseSyncCount(data: ApiSyncResponseData): number {
    if (typeof data === 'number') {
      return data;
    }
    return data?.count ?? data?.syncCount ?? data?.created ?? 0;
  }
}
