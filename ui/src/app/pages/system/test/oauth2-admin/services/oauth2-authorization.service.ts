import { inject, Service } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { AuthorizationDTO, AuthorizationQueryFilter } from '@app/pages/system/test/models/oauth2-admin.models';
import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

@Service()
export class OAuth2AuthorizationService {
  private http = inject(BaseHttpService);

  pageResource(param: () => SearchCommonVO<AuthorizationQueryFilter>): HttpResourceRef<PageInfo<AuthorizationDTO>> {
    return this.http.postResource<PageInfo<AuthorizationDTO>>('/manage/oauth2/authorization/page', param, { showLoading: true });
  }

  get(id: string): Observable<AuthorizationDTO> {
    return this.http.get(`/manage/oauth2/authorization/${id}`);
  }

  revoke(id: string): Observable<void> {
    return this.http.post(`/manage/oauth2/authorization/revoke/${id}`, {}, { needSuccessInfo: true });
  }

  delete(ids: string[]): Observable<void> {
    if (!ids.length) {
      return of(void 0);
    }
    return this.http.post('/manage/oauth2/authorization/del', { ids }, { needSuccessInfo: true });
  }
}
