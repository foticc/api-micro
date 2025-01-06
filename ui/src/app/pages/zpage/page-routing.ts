import { Route } from '@angular/router';

export default [
  { path: '', redirectTo: 'clients', pathMatch: 'full' },
  { path: 'clients', title: '客户端', data: { key: 'clients' }, loadComponent: () => import('./clients/clients.component').then(m => m.ClientsComponent) },
  { path: 'cms', title: 'CMS', data: { key: 'cms' }, loadComponent: () => import('./tvcms/tvcms.component').then(m => m.TvcmsComponent) },
  { path: 'cmscard', title: 'CMS-CARD', data: { key: 'card' }, loadComponent: () => import('./tvcmscard/tvcmscard.component').then(m => m.TvcmscardComponent) },
  { path: 'sse', title: 'Server-Sent Events', data: { key: 'sse' }, loadComponent: () => import('./sse/sse.component').then(m => m.SseComponent) }
] satisfies Route[];
