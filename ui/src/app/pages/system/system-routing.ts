import { Route } from '@angular/router';

export default [
  { path: '', redirectTo: 'dept', pathMatch: 'full' },
  { path: 'menu', title: 'menu.default:system:menu', data: { key: 'menu' }, loadComponent: () => import('./menu/menu.component').then(m => m.MenuComponent) },
  { path: 'account', title: 'menu.default:system:account', data: { key: 'account' }, loadComponent: () => import('./account/account.component').then(m => m.AccountComponent) },
  { path: 'dept', title: 'menu.default:system:dept', data: { key: 'dept' }, loadComponent: () => import('./dept/dept.component').then(m => m.DeptComponent) },
  { path: 'dict', title: 'menu.default:system:dict', data: { key: 'dict' }, loadComponent: () => import('./dict/dict.component').then(m => m.DictComponent) },
  { path: 'api', title: 'API资源管理', data: { key: 'api' }, loadComponent: () => import('./api/api-list.component').then(m => m.ApiListComponent) },
  { path: 'role-manager', loadChildren: () => import('./role-manager/role-manage-routing') },
  { path: 'test', loadChildren: () => import('./test/test-routing') }
] satisfies Route[];
