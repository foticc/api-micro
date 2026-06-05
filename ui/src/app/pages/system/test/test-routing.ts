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
    title: '角色管理（测试）',
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
  },
  {
    path: 'oauth2-client',
    title: 'OAuth2 客户端',
    data: { key: 'rbac-test-oauth2-client' },
    loadComponent: () => import('./oauth2-admin/client/oauth2-client-list.component').then(m => m.OAuth2ClientListComponent)
  },
  {
    path: 'oauth2-authorization',
    title: 'OAuth2 授权记录',
    data: { key: 'rbac-test-oauth2-authorization' },
    loadComponent: () => import('./oauth2-admin/authorization/oauth2-authorization-list.component').then(m => m.OAuth2AuthorizationListComponent)
  },
  {
    path: 'oauth2-consent',
    title: 'OAuth2 授权同意',
    data: { key: 'rbac-test-oauth2-consent' },
    loadComponent: () => import('./oauth2-admin/consent/oauth2-consent-list.component').then(m => m.OAuth2ConsentListComponent)
  }
] satisfies Route[];
