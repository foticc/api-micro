import { HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { PageInfo, SearchCommonVO } from '../../types';
import { BaseHttpService } from '../base-http.service';

export interface ApiPermissionRef {
  id: number;
  name: string;
}

export interface ApiResourceDTO {
  id?: number;
  method: string;
  path: string;
  description?: string;
  module?: string;
  name?: string;
  source?: string;
  status?: string;
  permissionCount?: number;
  permissions?: ApiPermissionRef[];
}

export interface ApiResourceSearchParam {
  keyword?: string;
  method?: string;
  module?: string;
  status?: string;
  unbound?: boolean;
  missingDescription?: boolean;
}

export interface ApiResourceModuleStat {
  module: string;
  count: number;
}

export interface ApiResourceModuleSummary {
  total: number;
  staleCount: number;
  modules: ApiResourceModuleStat[];
}

@Service()
export class ApiResourceService {
  http = inject(BaseHttpService);

  getApiResourcePageResource(param: () => SearchCommonVO<ApiResourceSearchParam>): HttpResourceRef<PageInfo<ApiResourceDTO>> {
    return this.http.postResource<PageInfo<ApiResourceDTO>>('/api/resource/page', param);
  }

  getModulesResource(param: () => Record<string, never>): HttpResourceRef<ApiResourceModuleSummary> {
    return this.http.postResource<ApiResourceModuleSummary>('/api/resource/modules', param);
  }

  getApiResourceListResource(param: () => ApiResourceSearchParam): HttpResourceRef<ApiResourceDTO[]> {
    return this.http.postResource<ApiResourceDTO[]>('/api/resource/list', () => ({ filters: param() }));
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
