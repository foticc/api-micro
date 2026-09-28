export interface PermissionApi {
  id?: number;
  method: string;
  path: string;
  description: string;
}

export interface PermissionMenu {
  id: number | string;
  code: string;
  name: string;
  type: 'menu' | 'button';
}

export interface RbacPermission {
  id: number;
  code: string;
  name: string;
  module: string;
  menuIds?: number[];
  apiIds?: number[];
  menus?: Array<Partial<PermissionMenu> & Record<string, unknown>>;
  apis?: PermissionApi[];
  description?: string;
}

/** 分页列表项：仅含统计字段，不含 menus / apis 明细 */
export interface RbacPermissionPageItem {
  id: number;
  code: string;
  name: string;
  module: string;
  menuCount: number;
  apiCount: number;
}

/** 创建/更新权限主表（不含 menu / api 绑定） */
export interface RbacPermissionPayload {
  code: string;
  name: string;
  module: string;
  description?: string;
}

/** PUT /permissions/{id}/apis | /menus 全量覆盖绑定；GET 同路径响应结构一致 */
export interface PermissionBindIdsPayload {
  ids: number[];
}

export type PermissionBindIdsResponse = PermissionBindIdsPayload;

export interface RbacRole {
  id: number;
  roleName: string;
  roleDesc: string;
  permissionIds: number[];
}

/** 角色分页列表项 */
export interface RbacRolePageItem {
  id: number;
  roleName: string;
  roleDesc?: string;
  permissionCount: number;
}

export interface RbacRolePayload {
  roleName: string;
  roleDesc?: string;
}

export interface RoleListFilters {
  keyword?: string;
}

export interface RbacTreeNode {
  key: string;
  title: string;
  type: 'module' | 'permission' | 'api' | 'menu';
  permissionId?: number;
  children?: RbacTreeNode[];
  selectable?: boolean;
  checked?: boolean;
  halfChecked?: boolean;
}

export interface PermissionListFilters {
  keyword?: string;
}

export interface PermissionListQuery {
  keyword?: string;
}
