import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResult, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

export interface DictItem {
  id: number;
  label: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class DictItemService {
  private http: BaseHttpService = inject(BaseHttpService);

  public create(param: DictItem): Observable<DictItem> {
    return this.http.post('/dict/item/create', param);
  }

  public delete(param: number[]): Observable<void> {
    return this.http.delete('/dict/item/delete', param);
  }

  public update(param: DictItem): Observable<DictItem> {
    return this.http.put('/dict/item/update', param);
  }

  public getOne(id: string): Observable<DictItem> {
    return this.http.get(`/dict/item/${id}`);
  }

  public page(param: SearchCommonVO<DictItem>): Observable<PageResult<DictItem>> {
    return this.http.post('/dict/item/page', param);
  }

  public listByDictId(id: number): Observable<DictItem[]> {
    return this.http.post(`/dict/item/list?dict=${id}`);
  }
}
