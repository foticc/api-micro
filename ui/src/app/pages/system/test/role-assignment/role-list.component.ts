import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { RbacTestService } from '@services/system/rbac-test.service';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { normalizePermissionMenus } from '../shared/permission-menu-tree.util';
import { PermissionApi, PermissionMenu, RbacPermissionPageItem, RbacRolePageItem } from '../models/rbac.models';

import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

type ViewMode = 'list' | 'assign';

@Component({
  selector: 'app-role-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzTableModule,
    NzButtonModule,
    NzWaveModule,
    NzInputModule,
    NzCheckboxModule,
    NzIconModule,
    NzAlertModule,
    NzEmptyModule,
    NzTagModule,
    NzSpinModule
  ],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.less'
})
export class RoleListComponent implements OnInit {
  private message = inject(NzMessageService);
  private rbacTestService = inject(RbacTestService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  viewMode = signal<ViewMode>('list');
  listKeyword = '';
  assignKeyword = '';
  onlySelected = false;
  listLoading = signal(false);
  assignLoading = signal(false);
  previewLoading = signal(false);
  saving = signal(false);

  rolePageList = signal<RbacRolePageItem[]>([]);
  roleTotal = signal(0);
  rolePageIndex = signal(1);
  rolePageSize = signal(10);

  permissionList = signal<RbacPermissionPageItem[]>([]);

  /** 勾选绑定到角色的资源组 */
  private selectedPermissionIds = new Set<number>();
  allChecked = false;
  indeterminate = false;

  /** 当前预览详情的资源组 id，默认不选中 */
  activePreviewId = signal<number | null>(null);
  previewMenus = signal<PermissionMenu[]>([]);
  previewApis = signal<PermissionApi[]>([]);

  assignRoleId = 0;
  assignRoleName = '';
  assignRoleDesc = '';

  readonly listPageHeader: Partial<PageHeaderType> = {
    title: '角色分配',
    desc: '为角色勾选权限资源组，与「权限资源组」页定义的数据一致。'
  };

  readonly assignPageHeader = signal<Partial<PageHeaderType>>({
    title: '分配权限资源组',
    desc: ''
  });

  ngOnInit(): void {
    this.loadRolePage();
  }

  selectedPermissionCount(): number {
    return this.selectedPermissionIds.size;
  }

  permissionListScroll(): { y: string } {
    return { y: '280px' };
  }

  readonly previewTableScroll = { y: '320px' };

  loadRolePage(pageIndex = this.rolePageIndex()): void {
    this.listLoading.set(true);
    const keyword = this.listKeyword.trim();
    this.rbacTestService
      .listRolesPage({
        pageIndex,
        pageSize: this.rolePageSize(),
        filters: keyword ? { keyword } : {}
      })
      .pipe(
        finalize(() => {
          this.listLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.rolePageList.set(data.list);
        this.roleTotal.set(data.total);
        this.rolePageIndex.set(data.pageIndex);
        this.rolePageSize.set(data.pageSize);
      });
  }

  searchRoles(): void {
    this.loadRolePage(1);
  }

  resetRoleSearch(): void {
    this.listKeyword = '';
    this.loadRolePage(1);
  }

  onRolePageIndexChange(index: number): void {
    this.loadRolePage(index);
  }

  onRolePageSizeChange(size: number): void {
    this.rolePageSize.set(size);
    this.loadRolePage(1);
  }

  openAssign(row: RbacRolePageItem): void {
    this.assignLoading.set(true);
    this.rbacTestService
      .getRole(row.id)
      .pipe(
        finalize(() => {
          this.assignLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(role => {
        if (!role) {
          this.message.warning('角色不存在');
          return;
        }
        this.assignRoleId = role.id;
        this.assignRoleName = role.roleName;
        this.assignRoleDesc = role.roleDesc ?? '';
        this.assignPageHeader.set({
          title: '分配权限资源组',
          desc: `当前角色：${this.assignRoleName}${this.assignRoleDesc ? ' — ' + this.assignRoleDesc : ''}`
        });
        this.assignKeyword = '';
        this.onlySelected = false;
        this.selectedPermissionIds = new Set(role.permissionIds);
        this.clearPreview();
        this.viewMode.set('assign');
        this.loadPermissionList();
      });
  }

  backToList(): void {
    this.viewMode.set('list');
    this.clearPreview();
    this.loadRolePage(this.rolePageIndex());
  }

  loadPermissionList(): void {
    this.assignLoading.set(true);
    const keyword = this.assignKeyword.trim();
    this.rbacTestService
      .listPermissionsPage({
        pageIndex: 1,
        pageSize: 9999,
        filters: keyword ? { keyword } : {}
      })
      .pipe(
        finalize(() => {
          this.assignLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        let list = data.list;
        if (this.onlySelected) {
          list = list.filter(p => this.selectedPermissionIds.has(p.id));
        }
        this.permissionList.set(list);
        this.refreshCheckedStatus();
        this.syncPreviewAfterListChange();
      });
  }

  searchPermissions(): void {
    this.loadPermissionList();
  }

  resetPermissionSearch(): void {
    this.assignKeyword = '';
    this.onlySelected = false;
    this.loadPermissionList();
  }

  onOnlySelectedChange(checked: boolean): void {
    this.onlySelected = checked;
    this.loadPermissionList();
  }

  isPermissionChecked(row: RbacPermissionPageItem): boolean {
    return this.selectedPermissionIds.has(row.id);
  }

  isPreviewActive(row: RbacPermissionPageItem): boolean {
    return this.activePreviewId() === row.id;
  }

  onPermissionChecked(row: RbacPermissionPageItem, checked: boolean): void {
    if (checked) {
      this.selectedPermissionIds.add(row.id);
    } else {
      this.selectedPermissionIds.delete(row.id);
    }
    this.refreshCheckedStatus();
    this.cdr.markForCheck();
  }

  onAllPermissionChecked(checked: boolean): void {
    for (const row of this.permissionList()) {
      if (checked) {
        this.selectedPermissionIds.add(row.id);
      } else {
        this.selectedPermissionIds.delete(row.id);
      }
    }
    this.refreshCheckedStatus();
    this.cdr.markForCheck();
  }

  selectPermissionPreview(row: RbacPermissionPageItem): void {
    if (this.activePreviewId() === row.id) {
      return;
    }
    this.activePreviewId.set(row.id);
    this.previewLoading.set(true);
    this.rbacTestService
      .getPermission(row.id)
      .pipe(
        finalize(() => {
          this.previewLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(p => {
        if (!p) {
          this.message.warning('权限资源组不存在');
          this.clearPreview();
          return;
        }
        this.previewMenus.set(normalizePermissionMenus(p.menus));
        this.previewApis.set(p.apis ?? []);
        this.cdr.markForCheck();
      });
  }

  refreshCheckedStatus(): void {
    const list = this.permissionList();
    if (list.length === 0) {
      this.allChecked = false;
      this.indeterminate = false;
      return;
    }
    const checkedCount = list.filter(r => this.isPermissionChecked(r)).length;
    this.allChecked = checkedCount === list.length;
    this.indeterminate = checkedCount > 0 && checkedCount < list.length;
  }

  private clearPreview(): void {
    this.activePreviewId.set(null);
    this.previewMenus.set([]);
    this.previewApis.set([]);
  }

  /** 筛选后若当前预览项不在列表中，清空预览 */
  private syncPreviewAfterListChange(): void {
    const previewId = this.activePreviewId();
    if (previewId == null) {
      return;
    }
    if (!this.permissionList().some(p => p.id === previewId)) {
      this.clearPreview();
    }
  }

  methodTagColor(method: string): string {
    const map: Record<string, string> = {
      GET: 'success',
      POST: 'processing',
      PUT: 'warning',
      DELETE: 'error',
      PATCH: 'purple'
    };
    return map[method] ?? 'default';
  }

  submitAssign(): void {
    if (this.selectedPermissionIds.size === 0) {
      this.message.warning('请至少选择一个权限资源组');
      return;
    }
    this.saving.set(true);
    const permissionIds = [...this.selectedPermissionIds];
    this.rbacTestService
      .assignRolePermissions(this.assignRoleId, permissionIds)
      .pipe(
        finalize(() => {
          this.saving.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => this.backToList()
      });
  }
}
