import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';

export interface NewRole {
  id?: number;
  roleName: string;
  roleDesc?: string;
}

export interface MenuTree {
  key: number;
  title: string;
  icon: string;
  children?: MenuTree[];
}

@Injectable({
  providedIn: 'root'
})
export class NnnService {
  http = inject(BaseHttpService);

  public getRoles(params: any): Observable<NewRole[]> {
    return this.http.post('/role/list', params);
  }

  public getMenuTree(id: any): Observable<NzTreeNodeOptions[]> {
    return this.http.post(`/menu/tree?id=${id}`, {});
  }

  public assignMenuToRole(id: number, menuIds: number[]): Observable<void> {
    return this.http.post(`/menu/assign/role?id=${id}`, menuIds);
  }
}
