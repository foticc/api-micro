import { Route } from '@angular/router';

import { CallbackComponent } from '@shared/auth/callback/callback.component';

export const appRoutes = [
  { path: '', redirectTo: '/login/login-form', pathMatch: 'full' },
  { path: 'blank', loadChildren: () => import('./layout/blank/blank-routing') },
  { path: 'login', data: { preload: true }, loadChildren: () => import('./pages/login/login-routing') },
  { path: 'default', data: { preload: true }, loadChildren: () => import('./layout/default/default-routing') },
  { path: 'callback', component: CallbackComponent },
  { path: '**', redirectTo: '/login/login-form' }
] satisfies Route[];
