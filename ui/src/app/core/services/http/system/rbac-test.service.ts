import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PermissionListFilters, PermissionListQuery, RbacPermission, RbacPermissionPageItem, RbacPermissionPayload, RbacRole, RbacRolePageItem, RoleListFilters } from '@app/pages/system/test/models/rbac.models';
import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

@Injectable({ providedIn: 'root' })
export class RbacTestService {
  private http = inject(BaseHttpService);

  listPermissions(query?: PermissionListQuery): Observable<RbacPermission[]> {
    return this.http.post('/rbac/permissions/list', query ?? {});
  }

  listPermissionsPage(param: SearchCommonVO<PermissionListFilters>): Observable<PageInfo<RbacPermissionPageItem>> {
    return this.http.post('/rbac/permissions/page', param, { showLoading: true });
  }

  getPermission(id: number): Observable<RbacPermission> {
    return this.http.get(`/rbac/permissions/${id}`);
  }

  createPermission(payload: RbacPermissionPayload): Observable<RbacPermission> {
    return this.http.post('/rbac/permissions', payload, { needSuccessInfo: true });
  }

  updatePermission(id: number, payload: RbacPermissionPayload): Observable<RbacPermission> {
    return this.http.put(`/rbac/permissions/${id}`, payload, { needSuccessInfo: true });
  }

  deletePermission(id: number): Observable<void> {
    return this.http.post('/rbac/permissions/del', { ids: [id] }, { needSuccessInfo: true });
  }

  listRoles(): Observable<RbacRole[]> {
    return this.http.get('/rbac/roles');
  }

  listRolesPage(param: SearchCommonVO<RoleListFilters>): Observable<PageInfo<RbacRolePageItem>> {
    return this.http.post('/rbac/roles/page', param, { showLoading: true });
  }

  getRole(id: number): Observable<RbacRole> {
    return this.http.get(`/rbac/roles/${id}`);
  }

  assignRolePermissions(roleId: number, permissionIds: number[]): Observable<void> {
    return this.http.post(`/rbac/roles/${roleId}/permissions`, { permissionIds }, { needSuccessInfo: true });
  }

  previewApis(permissionIds: number[]): Observable<{ total: number; list: RbacPermission['apis'] }> {
    return this.http.post('/rbac/permissions/preview-apis', { permissionIds });
  }
}
