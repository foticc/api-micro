import { inject, Service } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuditDemoParam, AuditDemoQueryParam, AuditDemoVO } from '../models/audit-demo.models';
import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

@Service()
export class AuditDemoService {
  private http = inject(BaseHttpService);

  getPageResource(param: () => SearchCommonVO<AuditDemoQueryParam>): HttpResourceRef<PageInfo<AuditDemoVO>> {
    return this.http.postResource<PageInfo<AuditDemoVO>>('/demo/audit/page', param);
  }

  getDetail(id: number): Observable<AuditDemoVO> {
    return this.http.get<AuditDemoVO>(`/demo/audit/${id}`);
  }

  create(param: AuditDemoParam): Observable<AuditDemoVO> {
    return this.http.post<AuditDemoVO>('/demo/audit', param, { needSuccessInfo: true });
  }

  update(id: number, param: AuditDemoParam): Observable<AuditDemoVO> {
    return this.http.put<AuditDemoVO>(`/demo/audit/${id}`, param, { needSuccessInfo: true });
  }

  delete(ids: number[]): Observable<void> {
    return this.http.post<void>('/demo/audit/del', ids, { needSuccessInfo: true });
  }
}
