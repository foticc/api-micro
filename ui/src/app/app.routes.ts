import { Route } from '@angular/router';


export const appRoutes = [
  { path: '', redirectTo: '/default', pathMatch: 'full' },
  { path: 'blank', loadChildren: () => import('./layout/blank/blank-routing') },
  { path: 'login', data: { preload: true }, loadChildren: () => import('./pages/login/login-routing') },
  { path: 'default', data: { preload: true }, loadChildren: () => import('./layout/default/default-routing') },
  {
    path: 'callback',
    data: { key: 'callback', preload: true },
    loadComponent: () => import('./pages/login/callback/callback.component').then(m => m.CallbackComponent)
  },
  { path: '**', redirectTo: '/login/login-form' }
] satisfies Route[];
