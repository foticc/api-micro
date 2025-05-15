import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { CacheService } from '@core/services/common/cache.service';
import { Menu } from '@core/services/types';

// 菜单store service
@Injectable({
  providedIn: 'root'
})
export class MenuStoreService {
  private menuArray$ = new BehaviorSubject<Menu[]>([]);
  private cacheService = inject(CacheService);

  constructor() {
    const menus = this.cacheService.get<Menu[]>('menus');
    if (menus) {
      this.setMenuArrayStore(menus);
    }
  }

  setMenuArrayStore(menuArray: Menu[]): void {
    this.cacheService.set<Menu[]>('menus', menuArray);
    this.menuArray$.next(menuArray);
  }

  getMenuArrayStore(): Observable<Menu[]> {
    if (this.menuArray$.value.length === 0) {
      const cachedData = this.cacheService.get<Menu[]>('menus');
      if (cachedData) {
        this.menuArray$.next(cachedData);
      }
    }
    return this.menuArray$.asObservable();
  }
}
