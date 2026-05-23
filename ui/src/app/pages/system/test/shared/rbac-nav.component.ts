import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
  selector: 'app-rbac-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzMenuModule, RouterLink, RouterLinkActive],
  template: `
    <ul nz-menu nzMode="horizontal" class="rbac-sub-nav">
      <li nz-menu-item nzMatchRouter>
        <a routerLink="/default/system/test/permissions">权限资源组</a>
      </li>
      <li nz-menu-item nzMatchRouter>
        <a routerLink="/default/system/test/menu-structure">资源结构</a>
      </li>
      <li nz-menu-item nzMatchRouter>
        <a routerLink="/default/system/test/roles">角色分配</a>
      </li>
    </ul>
  `,
  styles: `
    .rbac-sub-nav {
      margin-bottom: 16px;
      line-height: 46px;
    }
  `
})
export class RbacNavComponent {
  readonly router = inject(Router);
}
