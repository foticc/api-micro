import { inject, Service } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { ConsentDTO, ConsentKey, ConsentQueryFilter } from '@app/pages/system/test/models/oauth2-admin.models';
import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

@Service()
export class OAuth2ConsentService {
  private http = inject(BaseHttpService);

  pageResource(param: () => SearchCommonVO<ConsentQueryFilter>): HttpResourceRef<PageInfo<ConsentDTO>> {
    return this.http.postResource<PageInfo<ConsentDTO>>('/manage/oauth2/consent/page', param, { showLoading: true });
  }

  get(registeredClientId: string, principalName: string): Observable<ConsentDTO> {
    return this.http.get(`/manage/oauth2/consent/${encodeURIComponent(registeredClientId)}/${encodeURIComponent(principalName)}`);
  }

  create(body: ConsentDTO): Observable<ConsentDTO> {
    return this.http.post('/manage/oauth2/consent/create', body, { needSuccessInfo: true });
  }

  update(registeredClientId: string, principalName: string, body: ConsentDTO): Observable<ConsentDTO> {
    return this.http.put(
      `/manage/oauth2/consent/${encodeURIComponent(registeredClientId)}/${encodeURIComponent(principalName)}`,
      body,
      { needSuccessInfo: true }
    );
  }

  delete(items: ConsentKey[]): Observable<void> {
    if (!items.length) {
      return of(void 0);
    }
    return this.http.post('/manage/oauth2/consent/del', { items }, { needSuccessInfo: true });
  }
}
