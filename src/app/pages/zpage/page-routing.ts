import { Route } from '@angular/router';

export default [
  { path: '', redirectTo: 'clients', pathMatch: 'full' },
  { path: 'clients', title: '客户端', data: { key: 'clients' }, loadComponent: () => import('./clients/clients.component').then(m => m.ClientsComponent) }
] satisfies Route[];
