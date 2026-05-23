export interface PermissionApi {
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
  menuIds?: number[];
  menus?: PermissionMenu[];
  apis?: PermissionApi[];
  description?: string;
}

export interface RbacPermissionPayload {
  code: string;
  name: string;
  menuIds?: number[];
  apis?: PermissionApi[];
  description?: string;
}

export interface RbacRole {
  id: number;
  roleName: string;
  roleDesc: string;
  permissionIds: number[];
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

export interface RbacStructureTreeNode {
  key: string;
  title: string;
  type: 'module' | 'permission' | 'api' | 'menu';
  permissionId?: number;
  children?: RbacStructureTreeNode[];
}

export interface PermissionListFilters {
  keyword?: string;
}

export interface PermissionListQuery {
  keyword?: string;
}
