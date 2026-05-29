import { Route } from '@angular/router';

export default [
  { path: '', redirectTo: 'permission', pathMatch: 'full' },
  {
    path: 'permission',
    title: '权限资源组',
    data: { key: 'rbac-permission' },
    loadComponent: () => import('./permission/permission-list.component').then(m => m.PermissionListComponent)
  },
  {
    path: 'role-assignment',
    title: '角色分配',
    data: { key: 'rbac-role-assignment' },
    loadComponent: () => import('./role-assignment/role-list.component').then(m => m.RoleListComponent)
  },
  {
    path: 'menu',
    title: '菜单管理（测试）',
    data: { key: 'rbac-test-menu' },
    loadComponent: () => import('./menu/test-menu.component').then(m => m.TestMenuComponent)
  },
  {
    path: 'account',
    title: '账号管理（测试）',
    data: { key: 'rbac-test-account' },
    loadComponent: () => import('./account/test-account.component').then(m => m.TestAccountComponent)
  },
  {
    path: 'api',
    title: 'API 资源管理',
    data: { key: 'rbac-test-api' },
    loadComponent: () => import('./api/api-list.component').then(m => m.ApiListComponent)
  }
] satisfies Route[];
