import { Route } from '@angular/router';

export default [
  { path: '', redirectTo: 'permissions', pathMatch: 'full' },
  {
    path: 'permissions',
    title: '权限资源组',
    data: { key: 'rbac-permissions' },
    loadComponent: () => import('./permission-definition/permission-list.component').then(m => m.PermissionListComponent)
  },
  {
    path: 'menu-structure',
    title: '资源结构',
    data: { key: 'rbac-menu-structure' },
    loadComponent: () => import('./menu-structure/menu-structure.component').then(m => m.MenuStructureComponent)
  },
  {
    path: 'roles',
    title: '角色分配',
    data: { key: 'rbac-roles' },
    loadComponent: () => import('./role-assignment/role-list.component').then(m => m.RoleListComponent)
  }
] satisfies Route[];
