import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageInfo, SearchCommonVO } from '../../types';
import { BaseHttpService } from '../base-http.service';

export interface ApiResourceDTO {
  id?: number;
  method: string;
  path: string;
  description?: string;
}

export interface ApiResourceSearchParam {
  keyword?: string;
  method?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiResourceService {
  http = inject(BaseHttpService);

  getApiResourcePage(param: SearchCommonVO<ApiResourceSearchParam>): Observable<PageInfo<ApiResourceDTO>> {
    return this.http.post('/api/resource/page', param);
  }

  getApiResourceDetail(id: number): Observable<ApiResourceDTO> {
    return this.http.get(`/api/resource/${id}`);
  }

  addApiResource(param: Omit<ApiResourceDTO, 'id'>): Observable<void> {
    return this.http.post('/api/resource/create', param, { needSuccessInfo: true });
  }

  editApiResource(param: ApiResourceDTO): Observable<void> {
    return this.http.put('/api/resource/update', param, { needSuccessInfo: true });
  }

  delApiResource(ids: number[]): Observable<void> {
    return this.http.post('/api/resource/del', { ids }, { needSuccessInfo: true });
  }
}
