import { Route } from '@angular/router';

import { CallbackComponent } from '@shared/auth/callback/callback.component';

export const appRoutes = [
  { path: '', redirectTo: '/default', pathMatch: 'full' },
  { path: 'blank', loadChildren: () => import('./layout/blank/blank-routing') },
  { path: 'callback', component: CallbackComponent },
  { path: 'login', data: { preload: true }, loadChildren: () => import('./pages/login/login-routing') },
  { path: 'default', data: { preload: true }, loadChildren: () => import('./layout/default/default-routing') },
  { path: '**', redirectTo: '/login/login-form' }
] satisfies Route[];
