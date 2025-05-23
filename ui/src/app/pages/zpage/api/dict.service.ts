import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResult, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

export interface Dict {
  id?: number;
  code: string;
  value: number;
  desc: string;
}

@Injectable({
  providedIn: 'root'
})
export class DictService {
  http = inject(BaseHttpService);

  public getDictPage(param: SearchCommonVO<Dict>): Observable<PageResult<Dict>> {
    return this.http.post('/dict/page', param);
  }

  public save(dict: Dict): Observable<Dict> {
    return this.http.post('/dict/create', dict);
  }
}
