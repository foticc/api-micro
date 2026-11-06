import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { RbacTestService } from '@services/system/rbac-test.service';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { RbacPermission } from '../models/rbac.models';
import { ApiPickerModalComponent } from '../shared/api-picker-modal/api-picker-modal.component';
import { MenuPickerModalComponent } from '../shared/menu-picker-modal/menu-picker-modal.component';

@Component({
  selector: 'app-permission-config',
  imports: [PageHeaderComponent, NzButtonModule, NzCardModule, NzWaveModule, NzSpinModule, NzTabsModule, MenuPickerModalComponent, ApiPickerModalComponent],
  templateUrl: './permission-config.component.html',
  providers: [{ provide: NzModalRef, useValue: { destroy: () => undefined } }]
})
export class PermissionConfigComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private rbacTestService = inject(RbacTestService);
  private destroyRef = inject(DestroyRef);

  readonly menuPicker = viewChild(MenuPickerModalComponent);
  readonly apiPicker = viewChild(ApiPickerModalComponent);

  private permissionId = signal<number | null>(null);
  permission = signal<RbacPermission | null>(null);
  menuIds = signal<number[]>([]);
  apiIds = signal<number[]>([]);
  loading = signal(true);
  ready = signal(false);
  savingMenus = signal(false);
  savingApis = signal(false);

  readonly canSaveMenus = computed(() => this.ready() && (this.menuPicker()?.selectionReady() ?? false));
  readonly canSaveApis = computed(() => this.ready() && (this.apiPicker()?.selectionReady() ?? false));

  readonly pageHeader = computed<Partial<PageHeaderType>>(() => {
    const current = this.permission();
    if (!current) {
      return { title: '配置权限组', desc: '' };
    }
    const moduleText = current.module ? ` · ${current.module}` : '';
    return {
      title: `配置权限组 · ${current.name}`,
      desc: `${current.code}${moduleText}。菜单和接口分开配置，各自保存。`
    };
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const id = Number(params.get('id'));
      if (!Number.isFinite(id) || id <= 0) {
        this.message.warning('权限不存在');
        void this.router.navigate(['/default/test/permission']);
        return;
      }
      this.load(id);
    });
  }

  saveMenus(): void {
    const id = this.permissionId();
    const menus = this.menuPicker();
    if (id == null || !menus || !this.canSaveMenus()) {
      return;
    }
    this.savingMenus.set(true);
    this.rbacTestService
      .bindPermissionMenus(id, menus.selectedMenuIds(), false)
      .pipe(
        finalize(() => this.savingMenus.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => this.message.success('菜单已保存'),
        error: () => undefined
      });
  }

  saveApis(): void {
    const id = this.permissionId();
    const apis = this.apiPicker();
    if (id == null || !apis || !this.canSaveApis()) {
      return;
    }
    this.savingApis.set(true);
    this.rbacTestService
      .bindPermissionApis(id, apis.selectedApiIds(), false)
      .pipe(
        finalize(() => this.savingApis.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => this.message.success('接口已保存'),
        error: () => undefined
      });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.ready.set(false);
    this.permissionId.set(id);
    forkJoin({
      permission: this.rbacTestService.getPermission(id),
      menus: this.rbacTestService.getPermissionMenuIds(id),
      apis: this.rbacTestService.getPermissionApiIds(id)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ permission, menus, apis }) => {
          this.permission.set(permission);
          this.menuIds.set(menus.ids ?? []);
          this.apiIds.set(apis.ids ?? []);
          this.ready.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.message.warning('权限不存在或加载失败');
          void this.router.navigate(['/default/test/permission']);
        }
      });
  }
}
