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

export interface RbacPermissionPayload {
  code: string;
  name: string;
  module: string;
  menuIds?: number[];
  apiIds?: number[];
  description?: string;
}

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
