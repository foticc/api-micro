import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageInfo, SearchCommonVO } from '../../types';
import { BaseHttpService } from '../base-http.service';

export interface DictItem {
  id?: number;
  code: string;
  name: string;
}

export interface DictSearchParam {
  keyword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DictService {
  http = inject(BaseHttpService);

  public getDictList(param: SearchCommonVO<DictSearchParam>): Observable<PageInfo<DictItem>> {
    return this.http.post('/dict/page', param);
  }

  public getDictDetail(id: number): Observable<DictItem> {
    return this.http.get(`/dict/${id}`);
  }

  public addDict(param: DictItem): Observable<void> {
    return this.http.post('/dict/create', param, { needSuccessInfo: true });
  }

  public editDict(param: DictItem): Observable<void> {
    return this.http.post('/dict/create', param, { needSuccessInfo: true });
  }

  public delDict(ids: number[]): Observable<void> {
    return this.http.post('/dict/del', { ids }, { needSuccessInfo: true });
  }
}
