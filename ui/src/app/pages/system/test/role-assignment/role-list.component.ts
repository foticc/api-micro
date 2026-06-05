import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { RbacTestService } from '@services/system/rbac-test.service';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { ModalBtnStatus } from '@widget/base-modal';
import { TestRoleModalService } from '@app/pages/system/test/role-assignment/test-role-modal/test-role-modal.service';
import { normalizePermissionMenus } from '../shared/permission-menu-tree.util';
import { PermissionApi, PermissionMenu, RbacPermissionPageItem, RbacRolePageItem, RbacRolePayload } from '../models/rbac.models';

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
import { NzModalService } from 'ng-zorro-antd/modal';
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
  private modalSrv = inject(NzModalService);
  private roleModalService = inject(TestRoleModalService);
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

  private selectedRoleIds = new Set<number>();
  allRoleChecked = false;
  roleIndeterminate = false;

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
    title: '角色管理（测试）',
    desc: '角色的增删改查与权限资源组分配。'
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
        this.refreshRoleCheckedStatus();
      });
  }

  addRole(): void {
    this.roleModalService
      .show({ nzTitle: '新增角色' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.listLoading.set(true);
        this.rbacTestService
          .createRole(res.modalValue as RbacRolePayload)
          .pipe(
            finalize(() => {
              this.listLoading.set(false);
              this.cdr.markForCheck();
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => this.loadRolePage(1));
      });
  }

  editRole(row: RbacRolePageItem): void {
    this.rbacTestService
      .getRole(row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(role => {
        if (!role) {
          this.message.warning('角色不存在');
          return;
        }
        this.roleModalService
          .show({ nzTitle: '编辑角色' }, { roleName: role.roleName, roleDesc: role.roleDesc })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            this.listLoading.set(true);
            this.rbacTestService
              .updateRole(row.id, modalValue as RbacRolePayload)
              .pipe(
                finalize(() => {
                  this.listLoading.set(false);
                  this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef)
              )
              .subscribe(() => this.loadRolePage(this.rolePageIndex()));
          });
      });
  }

  delRole(id: number): void {
    this.confirmDeleteRoles([id]);
  }

  batchDelRoles(): void {
    if (this.selectedRoleIds.size === 0) {
      this.message.error('请勾选数据');
      return;
    }
    this.confirmDeleteRoles([...this.selectedRoleIds]);
  }

  isRoleChecked(row: RbacRolePageItem): boolean {
    return this.selectedRoleIds.has(row.id);
  }

  onRoleChecked(row: RbacRolePageItem, checked: boolean): void {
    if (checked) {
      this.selectedRoleIds.add(row.id);
    } else {
      this.selectedRoleIds.delete(row.id);
    }
    this.refreshRoleCheckedStatus();
    this.cdr.markForCheck();
  }

  onAllRoleChecked(checked: boolean): void {
    for (const row of this.rolePageList()) {
      if (checked) {
        this.selectedRoleIds.add(row.id);
      } else {
        this.selectedRoleIds.delete(row.id);
      }
    }
    this.refreshRoleCheckedStatus();
    this.cdr.markForCheck();
  }

  private refreshRoleCheckedStatus(): void {
    const list = this.rolePageList();
    if (list.length === 0) {
      this.allRoleChecked = false;
      this.roleIndeterminate = false;
      return;
    }
    const checkedCount = list.filter(r => this.selectedRoleIds.has(r.id)).length;
    this.allRoleChecked = checkedCount === list.length;
    this.roleIndeterminate = checkedCount > 0 && checkedCount < list.length;
  }

  private confirmDeleteRoles(ids: number[]): void {
    this.modalSrv.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.listLoading.set(true);
        this.rbacTestService
          .deleteRole(ids)
          .pipe(
            finalize(() => {
              this.listLoading.set(false);
              this.cdr.markForCheck();
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            ids.forEach(id => this.selectedRoleIds.delete(id));
            if (this.rolePageList().length === ids.length && this.rolePageIndex() > 1) {
              this.loadRolePage(this.rolePageIndex() - 1);
            } else {
              this.loadRolePage(this.rolePageIndex());
            }
          });
      }
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
