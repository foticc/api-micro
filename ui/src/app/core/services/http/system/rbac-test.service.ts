import { HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PermissionBindIdsPayload,
  PermissionBindIdsResponse,
  PermissionListFilters,
  PermissionListQuery,
  RbacPermission,
  RbacPermissionPageItem,
  RbacPermissionPayload,
  RbacRole,
  RbacRolePageItem,
  RbacRolePayload,
  RoleListFilters
} from '@app/pages/system/test/models/rbac.models';
import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

@Service()
export class RbacTestService {
  private http = inject(BaseHttpService);

  listPermissions(query?: PermissionListQuery): Observable<RbacPermission[]> {
    return this.http.post('/rbac/permissions/list', query ?? {});
  }

  getPermissionsPageResource(param: () => SearchCommonVO<PermissionListFilters>): HttpResourceRef<PageInfo<RbacPermissionPageItem>> {
    return this.http.postResource<PageInfo<RbacPermissionPageItem>>('/rbac/permissions/page', param, { showLoading: true });
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

  bindPermissionApis(id: number, ids: number[]): Observable<RbacPermission> {
    const body: PermissionBindIdsPayload = { ids };
    return this.http.put(`/rbac/permissions/${id}/apis`, body, { needSuccessInfo: true });
  }

  bindPermissionMenus(id: number, ids: number[]): Observable<RbacPermission> {
    const body: PermissionBindIdsPayload = { ids };
    return this.http.put(`/rbac/permissions/${id}/menus`, body, { needSuccessInfo: true });
  }

  getPermissionMenuIds(id: number): Observable<PermissionBindIdsResponse> {
    return this.http.get<PermissionBindIdsResponse>(`/rbac/permissions/${id}/menus`);
  }

  getPermissionApiIds(id: number): Observable<PermissionBindIdsResponse> {
    return this.http.get<PermissionBindIdsResponse>(`/rbac/permissions/${id}/apis`);
  }

  listRoles(): Observable<RbacRole[]> {
    return this.http.post('/rbac/roles/list', {});
  }

  getRolesListResource(param: () => Partial<RoleListFilters> = () => ({})): HttpResourceRef<RbacRole[]> {
    return this.http.postResource<RbacRole[]>('/rbac/roles/list', param);
  }

  getRolesPageResource(param: () => SearchCommonVO<RoleListFilters>): HttpResourceRef<PageInfo<RbacRolePageItem>> {
    return this.http.postResource<PageInfo<RbacRolePageItem>>('/rbac/roles/page', param, { showLoading: true });
  }

  getRole(id: number): Observable<RbacRole> {
    return this.http.get(`/rbac/roles/${id}`);
  }

  createRole(payload: RbacRolePayload): Observable<RbacRole> {
    return this.http.post('/role/create', payload, { needSuccessInfo: true });
  }

  updateRole(id: number, payload: RbacRolePayload): Observable<RbacRole> {
    return this.http.put(`/role/${id}`, payload, { needSuccessInfo: true });
  }

  deleteRole(ids: number[]): Observable<void> {
    return this.http.post('/role/del', { ids }, { needSuccessInfo: true });
  }

  assignRolePermissions(roleId: number, permissionIds: number[]): Observable<void> {
    return this.http.post(`/rbac/roles/${roleId}/permissions`, { permissionIds }, { needSuccessInfo: true });
  }

  previewApis(permissionIds: number[]): Observable<{ total: number; list: RbacPermission['apis'] }> {
    return this.http.post('/rbac/permissions/preview-apis', { permissionIds });
  }
}
