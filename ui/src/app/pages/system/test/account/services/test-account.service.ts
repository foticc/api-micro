import { inject, Service } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { TestUser, TestUserPsd } from '@app/pages/system/test/models/test-account.models';
import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

@Service()
export class TestAccountService {
  private http = inject(BaseHttpService);

  getAccountResource(param: () => SearchCommonVO<TestUser>): HttpResourceRef<PageInfo<TestUser>> {
    return this.http.postResource<PageInfo<TestUser>>('/rbac/users/page', param);
  }

  getAccountDetail(id: number): Observable<TestUser> {
    return this.http.get(`/rbac/users/${id}`);
  }

  getAccountAuthCode(id: number): Observable<string[]> {
    return this.http.get(`/rbac/users/auth-code/${id}`);
  }

  addAccount(param: TestUser): Observable<void> {
    const { id: _id, ...body } = param;
    return this.http.post('/rbac/users', body, { needSuccessInfo: true });
  }

  delAccount(ids: number[]): Observable<void> {
    if (!ids.length) {
      return of(void 0);
    }
    return this.http.post('/rbac/users/del', { ids }, { needSuccessInfo: true });
  }

  editAccount(param: TestUser): Observable<void> {
    const { id, ...body } = param;
    return this.http.put(`/rbac/users/${id}`, body, { needSuccessInfo: true });
  }

  editAccountPsd(param: TestUserPsd): Observable<void> {
    const { id, ...body } = param;
    return this.http.put(`/rbac/users/${id}/psd`, body);
  }
}
