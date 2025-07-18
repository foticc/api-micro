import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResult, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

export interface Dict {
  id: number;
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class DictService {
  private http: BaseHttpService = inject(BaseHttpService);

  public create(param: Dict): Observable<Dict> {
    return this.http.post('/dict/create', param);
  }

  public delete(param: number[]): Observable<void> {
    return this.http.delete('/dict/delete', param);
  }

  public update(param: Dict): Observable<Dict> {
    return this.http.put('/dict/update', param);
  }

  public getOne(id: string): Observable<Dict> {
    return this.http.get(`/dict/${id}`);
  }

  public page(param: SearchCommonVO<Dict>): Observable<PageResult<Dict>> {
    param.sort = 'id,desc';
    return this.http.post('/dict/page', param);
  }
}
