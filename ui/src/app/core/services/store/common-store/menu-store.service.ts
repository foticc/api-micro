import { Service, signal } from '@angular/core';

import { Menu } from '@core/services/types';

// 菜单store service
@Service()
export class MenuStoreService {
  $menuArray = signal<Menu[]>([]);

  setMenuArrayStore(menuArray: Menu[]): void {
    this.$menuArray.set(menuArray);
  }
}
