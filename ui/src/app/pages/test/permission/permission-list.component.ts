import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { RbacTestService } from '@services/system/rbac-test.service';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { ModalBtnStatus } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';

import { RbacPermissionPageItem, RbacPermissionPayload, PermissionListFilters } from '../models/rbac.models';
import { PermissionModalService } from '../permission/permission-modal/permission-modal.service';

@Component({
  selector: 'app-permission-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, FormsModule, NzCardModule, NzFormModule, NzGridModule, NzInputModule, NzButtonModule, NzWaveModule, NzIconModule, NzTableModule, NzModalModule],
  templateUrl: './permission-list.component.html'
})
export class PermissionListComponent {
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private permissionModal = inject(PermissionModalService);
  private rbacTestService = inject(RbacTestService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  keyword = this.route.snapshot.queryParamMap.get('keyword')?.trim() ?? '';

  private listFilters = signal<PermissionListFilters>(this.keyword ? { keyword: this.keyword } : {});
  pageIndex = signal(1);
  pageSize = signal(10);
  total = signal(0);
  loading = signal(false);

  permissionsResource = this.rbacTestService.getPermissionsPageResource(() => {
    const keyword = this.listFilters().keyword?.trim();
    return {
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      filters: keyword ? { keyword } : {}
    };
  });

  pageList = computed(() => {
    if (this.permissionsResource.hasValue()) {
      return this.permissionsResource.value().list;
    }
    return [] as RbacPermissionPageItem[];
  });

  private syncPermissionListState = effect(() => {
    this.loading.set(this.permissionsResource.isLoading());
    if (this.permissionsResource.hasValue()) {
      this.total.set(this.permissionsResource.value().total);
      this.cdr.markForCheck();
    }
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const keyword = params.get('keyword')?.trim() ?? '';
      if (!keyword || keyword === this.listFilters().keyword) {
        return;
      }
      this.keyword = keyword;
      this.listFilters.set({ keyword });
      this.pageIndex.set(1);
    });
  }

  readonly listPageHeader: Partial<PageHeaderType> = {
    title: '权限资源组',
    desc: '维护权限组定义。从操作列进入配置，分别维护菜单和接口。'
  };

  reloadPage(): void {
    this.permissionsResource.reload();
  }

  search(): void {
    const kw = this.keyword.trim();
    this.listFilters.set(kw ? { keyword: kw } : {});
    this.pageIndex.set(1);
  }

  resetSearch(): void {
    this.keyword = '';
    this.listFilters.set({});
    this.pageIndex.set(1);
  }

  onPageIndexChange(index: number): void {
    this.pageIndex.set(index);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
  }

  openConfig(row: RbacPermissionPageItem): void {
    void this.router.navigate(['/default/test/permission', row.id]);
  }

  openCreate(): void {
    this.permissionModal
      .show({ nzTitle: '新增权限', nzWidth: 560 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.rbacTestService
          .createPermission(res.modalValue as RbacPermissionPayload)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.pageIndex.set(1);
            this.permissionsResource.reload();
          });
      });
  }

  openEdit(row: RbacPermissionPageItem): void {
    this.rbacTestService
      .getPermission(row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => {
        if (!p) {
          this.message.warning('权限不存在');
          return;
        }
        const modalData: RbacPermissionPayload = {
          module: p.module ?? '',
          code: p.code,
          name: p.name,
          description: p.description || ''
        };
        this.permissionModal
          .show({ nzTitle: '编辑权限', nzWidth: 560 }, modalData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            this.rbacTestService
              .updatePermission(row.id, modalValue as RbacPermissionPayload)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => this.permissionsResource.reload());
          });
      });
  }

  remove(row: RbacPermissionPageItem): void {
    this.modal.confirm({
      nzTitle: '确认删除',
      nzContent: `删除权限「${row.name}」？关联的菜单与接口绑定将一并移除。`,
      nzOnOk: () =>
        this.rbacTestService
          .deletePermission(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              if (this.pageList().length === 1 && this.pageIndex() > 1) {
                this.pageIndex.update(p => Math.max(1, p - 1));
              } else {
                this.permissionsResource.reload();
              }
            }
          })
    });
  }
}
