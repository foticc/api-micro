import { Service, signal } from '@angular/core';

import { Menu } from '../../types';

/**
 * 自动分割菜单时，左侧菜单的store
 */
@Service()
export class SplitNavStoreService {
  $splitLeftNavArray = signal<Menu[]>([]);
}
