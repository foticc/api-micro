import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { CacheService } from '@core/services/common/cache.service';
import { Menu } from '@core/services/types';
import { MenusService } from '@services/system/menus.service';

// 菜单store service
@Injectable({
  providedIn: 'root'
})
export class MenuStoreService {
  private menuArray$ = new BehaviorSubject<Menu[]>([]);


  setMenuArrayStore(menuArray: Menu[]): void {
    this.menuArray$.next(menuArray);
  }

  getMenuArrayStore(): Observable<Menu[]> {
    return this.menuArray$.asObservable();
  }
}
