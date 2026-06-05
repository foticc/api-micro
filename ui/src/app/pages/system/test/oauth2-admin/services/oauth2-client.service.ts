import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  RegisteredClientDTO,
  RegisteredClientQueryFilter
} from '@app/pages/system/test/models/oauth2-admin.models';
import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

@Injectable({
  providedIn: 'root'
})
export class OAuth2ClientService {
  private http = inject(BaseHttpService);

  page(param: SearchCommonVO<RegisteredClientQueryFilter>): Observable<PageInfo<RegisteredClientDTO>> {
    return this.http.post('/manage/oauth2/client/page', param, { showLoading: true });
  }

  get(id: string): Observable<RegisteredClientDTO> {
    return this.http.get(`/manage/oauth2/client/${id}`);
  }

  create(body: RegisteredClientDTO): Observable<RegisteredClientDTO> {
    return this.http.post('/manage/oauth2/client/create', body, { needSuccessInfo: true });
  }

  update(id: string, body: RegisteredClientDTO): Observable<RegisteredClientDTO> {
    return this.http.put(`/manage/oauth2/client/${id}`, body, { needSuccessInfo: true });
  }

  delete(ids: string[]): Observable<void> {
    if (!ids.length) {
      return of(void 0);
    }
    return this.http.post('/manage/oauth2/client/del', { ids }, { needSuccessInfo: true });
  }
}
