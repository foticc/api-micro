import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PermissionListFilters, PermissionListQuery, RbacPermission, RbacPermissionPayload, RbacRole, RbacStructureTreeNode } from '@app/pages/system/test/models/rbac.models';
import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

@Injectable({ providedIn: 'root' })
export class RbacTestService {
  private http = inject(BaseHttpService);

  listPermissions(query?: PermissionListQuery): Observable<RbacPermission[]> {
    return this.http.post('/rbac-test/permissions/list', query ?? {});
  }

  listPermissionsPage(param: SearchCommonVO<PermissionListFilters>): Observable<PageInfo<RbacPermission>> {
    return this.http.post('/rbac-test/permissions/page', param, { showLoading: true });
  }

  getPermission(id: number): Observable<RbacPermission> {
    return this.http.get(`/rbac-test/permissions/${id}`);
  }

  createPermission(payload: RbacPermissionPayload): Observable<RbacPermission> {
    return this.http.post('/rbac-test/permissions', payload, { needSuccessInfo: true });
  }

  updatePermission(id: number, payload: RbacPermissionPayload): Observable<RbacPermission> {
    return this.http.put(`/rbac-test/permissions/${id}`, payload, { needSuccessInfo: true });
  }

  deletePermission(id: number): Observable<void> {
    return this.http.delete(`/rbac-test/permissions/${id}`, undefined, { needSuccessInfo: true });
  }

  getMenuStructureTree(): Observable<RbacStructureTreeNode[]> {
    return this.http.get('/rbac-test/menu-structure');
  }

  listRoles(): Observable<RbacRole[]> {
    return this.http.get('/rbac-test/roles');
  }

  getRole(id: number): Observable<RbacRole> {
    return this.http.get(`/rbac-test/roles/${id}`);
  }

  assignRolePermissions(roleId: number, permissionIds: number[]): Observable<void> {
    return this.http.post(`/rbac-test/roles/${roleId}/permissions`, { permissionIds }, { needSuccessInfo: true });
  }

  previewApis(permissionIds: number[]): Observable<{ total: number; list: RbacPermission['apis'] }> {
    return this.http.post('/rbac-test/permissions/preview-apis', { permissionIds });
  }
}
