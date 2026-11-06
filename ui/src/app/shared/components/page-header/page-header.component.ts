import { Component, inject, TemplateRef, input } from '@angular/core';
import { Router } from '@angular/router';

import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';

export interface PageHeaderType {
  title: string;
  desc: string | TemplateRef<NzSafeAny>;
  extra: string | TemplateRef<NzSafeAny>;
  breadcrumb: string[];
  footer: string | TemplateRef<NzSafeAny>;
}

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.less',

  imports: [NzPageHeaderModule, NzBreadCrumbModule, NzOutletModule, NzIconModule]
})
export class PageHeaderComponent {
  private router = inject(Router);
  readonly backTpl = input<TemplateRef<NzSafeAny>>();
  readonly pageHeaderInfo = input<Partial<PageHeaderType>>({});
  readonly backUrl = input('');
  /** 同页切换时使用，优先于 backUrl */
  readonly backAction = input<(() => void) | null>(null);

  back(): void {
    const action = this.backAction();
    if (action) {
      action();
      return;
    }
    void this.router.navigateByUrl(this.backUrl());
  }
}
