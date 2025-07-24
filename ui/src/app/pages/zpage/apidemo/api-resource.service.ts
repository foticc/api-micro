import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResult, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

export interface ApiResource {
  id?: number;
  method: string;
  path: string;
  description: string;
}

export interface ApiResourceQuery {
  path: string;
  method: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiResourceService {
  private http: BaseHttpService = inject(BaseHttpService);

  public create(param: ApiResource): Observable<ApiResource> {
    return this.http.post('/api/resource/create', param);
  }

  public delete(param: number[]): Observable<void> {
    return this.http.delete('/api/resource/delete', param);
  }

  public update(id: number, param: ApiResource): Observable<ApiResource> {
    return this.http.put(`/api/resource/update?id=${id}`, param);
  }

  public getOne(id: string): Observable<ApiResource> {
    return this.http.get(`/api/resource/${id}`);
  }

  public page(param: SearchCommonVO<ApiResource>): Observable<PageResult<ApiResource>> {
    return this.http.post('/api/resource/page', param);
  }
}
