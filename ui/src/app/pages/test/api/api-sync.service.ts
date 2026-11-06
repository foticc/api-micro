import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';

import { ApiSyncResult } from './models/api-sync.models';

@Service()
export class ApiSyncService {
  private readonly http = inject(BaseHttpService);

  /** POST /rbac/api/sync — 扫描已注册接口并写入资源库 */
  runSync(): Observable<ApiSyncResult> {
    return this.http.post<ApiSyncResult>('/rbac/api/sync', {});
  }
}
