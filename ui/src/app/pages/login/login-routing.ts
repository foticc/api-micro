import { Route } from '@angular/router';

import { LoginComponent } from './login.component';

export default [
  {
    path: '',
    component: LoginComponent,
    title: 'login.pageTitle', // angular14版本以上支持，修改浏览器title
    data: { key: 'login', shouldDetach: 'no' },
    children: [
      { path: '', redirectTo: '/login/login-form', pathMatch: 'full' },
      {
        path: 'login-form',
        title: 'login.loginPageTitle',
        data: { preload: true, key: 'login-form', shouldDetach: 'no' },
        loadComponent: () => import('./login-form/login-form.component').then(m => m.LoginFormComponent)
      },
      {
        path: 'oauth-callback',
        title: 'OAuth2 登录回调',
        data: { key: 'oauth-callback', shouldDetach: 'no' },
        loadComponent: () =>
          import('@app/pages/system/test/oauth2/oauth2-callback.component').then(m => m.OAuth2CallbackComponent)
      },
      {
        path: 'register-form',
        title: 'login.registerPageTitle',
        data: { key: 'register-form', shouldDetach: 'no' },
        loadComponent: () => import('./register-form/register-form.component').then(m => m.RegisterFormComponent)
      }
    ]
  }
] satisfies Route[];
