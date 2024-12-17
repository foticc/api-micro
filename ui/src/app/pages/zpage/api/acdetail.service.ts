import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';

interface QueryParams {
  name: string | undefined;
  page: number | undefined;
  size: number | undefined;
}

interface PageResult<T> {
  content: T[];
  page: Page;
}

interface Page {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface AcDetail {
  id: number;
  vodName: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AcDetailService {
  http = inject(BaseHttpService);

  fetchPage(params: QueryParams): Observable<PageResult<AcDetail>> {
    return this.http.get('/demo/api/acdetail/page', params, { otherUrl: true });
  }

  getOne(id: string): Observable<AcDetail> {
    return this.http.get('/client/manage/get', { id });
  }

  save(client: AcDetail): Observable<AcDetail> {
    return this.http.post('/client/manage/save', client);
  }

  delete(id: string): Observable<any> {
    return this.http.post('/client/manage/delete', { id: id });
  }
}
