import { Service, signal } from '@angular/core';

import { LoginType } from '@app/pages/other-login/login1/login1.component';

// 这个是缓存login1的store，属于业务的store
@Service()
export class Login1StoreService {
  $loginTypeStore = signal<LoginType>(LoginType.Normal);

  isLogin1OverModelSignalStore = signal<boolean>(false);
}
