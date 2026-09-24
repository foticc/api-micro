import { HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

import { DemoSgd1, DemoSgd1Query } from '../models/demo-sgd1.models';

@Service()
export class DemoSgd1Service {
  private http = inject(BaseHttpService);

  getPageResource(param: () => SearchCommonVO<DemoSgd1Query>): HttpResourceRef<PageInfo<DemoSgd1>> {
    return this.http.postResource<PageInfo<DemoSgd1>>('/demo/sgd1/page', param);
  }

  save(): Observable<void> {
    return this.http.post<void>('/demo/sgd1/save', null, { needSuccessInfo: true });
  }

  delete(row: DemoSgd1): Observable<void> {
    return this.http.post<void>('/demo/sgd1/delete', { time: row.time }, { needSuccessInfo: true });
  }
}
