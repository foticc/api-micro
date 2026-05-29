import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { TestMenuListObj } from '@app/pages/system/test/models/test-menu.models';
import { Menu, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

import { NzSafeAny } from 'ng-zorro-antd/core/types';

@Injectable({
  providedIn: 'root'
})
export class TestMenusService {
  private http = inject(BaseHttpService);

  getMenuList(param: SearchCommonVO<NzSafeAny>): Observable<Menu[]> {
    return this.http.post('/rbac/menu/list', param);
  }

  addMenus(param: TestMenuListObj): Observable<void> {
    const { id: _id, ...body } = param;
    return this.http.post('/rbac/menu', body, { needSuccessInfo: true });
  }

  editMenus(param: TestMenuListObj): Observable<void> {
    const { id, ...body } = param;
    return this.http.put(`/rbac/menu/${id}`, body, { needSuccessInfo: true });
  }

  delMenus(id: number): Observable<void> {
    return this.http.post('/rbac/menu/del', { ids: [id] }, { needSuccessInfo: true });
  }

  getMenuDetail(id: number): Observable<TestMenuListObj> {
    return this.http.get(`/rbac/menu/${id}`);
  }
}
