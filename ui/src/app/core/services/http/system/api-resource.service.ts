import { inject, Service } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
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

@Service()
export class ApiResourceService {
  http = inject(BaseHttpService);

  getApiResourcePageResource(param: () => SearchCommonVO<ApiResourceSearchParam>): HttpResourceRef<PageInfo<ApiResourceDTO>> {
    return this.http.postResource<PageInfo<ApiResourceDTO>>('/api/resource/page', param);
  }

  getApiResourcePage(param: SearchCommonVO<ApiResourceSearchParam>): Observable<PageInfo<ApiResourceDTO>> {
    return this.http.post('/api/resource/page', param);
  }

  getApiResourceDetail(id: number): Observable<ApiResourceDTO> {
    return this.http.get(`/api/resource/${id}`);
  }

  addApiResource(param: Omit<ApiResourceDTO, 'id'>): Observable<void> {
    return this.http.post('/api/resource/create', param, { needSuccessInfo: true });
  }

  editApiResource(id: number, param: Omit<ApiResourceDTO, 'id'>): Observable<ApiResourceDTO> {
    return this.http.put<ApiResourceDTO>(`/api/resource/${id}`, param, { needSuccessInfo: true });
  }

  delApiResource(ids: number[]): Observable<void> {
    return this.http.post('/api/resource/del', { ids }, { needSuccessInfo: true });
  }
}
