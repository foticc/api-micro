import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { TestRoleModalService } from '../role-assignment/test-role-modal/test-role-modal.service';
import { RbacTestService } from '@services/system/rbac-test.service';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { ModalBtnStatus } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { PermissionListFilters, RbacPermissionPageItem, RbacRolePageItem, RbacRolePayload, RoleListFilters } from '../models/rbac.models';

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
    NzTagModule,
    NzSpinModule
  ],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.less'
})
export class RoleListComponent {
  private message = inject(NzMessageService);
  private modalSrv = inject(NzModalService);
  private roleModalService = inject(TestRoleModalService);
  private rbacTestService = inject(RbacTestService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  viewMode = signal<ViewMode>('list');
  listKeyword = '';
  assignKeyword = '';
  onlySelected = signal(false);
  listLoading = signal(false);
  assignLoading = signal(false);
  saving = signal(false);

  private roleListFilters = signal<RoleListFilters>({});
  rolePageIndex = signal(1);
  rolePageSize = signal(10);
  roleTotal = signal(0);

  rolesResource = this.rbacTestService.getRolesPageResource(() => {
    const keyword = this.roleListFilters().keyword?.trim();
    return {
      pageIndex: this.rolePageIndex(),
      pageSize: this.rolePageSize(),
      filters: keyword ? { keyword } : {}
    };
  });

  rolePageList = computed(() => {
    if (this.rolesResource.hasValue()) {
      return this.rolesResource.value().list;
    }
    return [] as RbacRolePageItem[];
  });

  private syncRoleListState = effect(() => {
    this.listLoading.set(this.rolesResource.isLoading());
    if (this.rolesResource.hasValue()) {
      this.roleTotal.set(this.rolesResource.value().total);
      this.refreshRoleCheckedStatus();
      this.cdr.markForCheck();
    }
  });

  private selectedRoleIds = new Set<number>();
  allRoleChecked = false;
  roleIndeterminate = false;

  private assignPermissionFilters = signal<PermissionListFilters>({});

  assignPermissionsResource = this.rbacTestService.getPermissionsPageResource(() => {
    if (this.viewMode() !== 'assign') {
      return { pageIndex: 1, pageSize: 0, filters: {} };
    }
    const keyword = this.assignPermissionFilters().keyword?.trim();
    return {
      pageIndex: 1,
      pageSize: 9999,
      filters: keyword ? { keyword } : {}
    };
  });

  permissionList = computed(() => {
    if (this.viewMode() !== 'assign' || !this.assignPermissionsResource.hasValue()) {
      return [] as RbacPermissionPageItem[];
    }
    let list = this.assignPermissionsResource.value().list;
    if (this.onlySelected()) {
      list = list.filter(p => this.selectedPermissionIds.has(p.id));
    }
    return list;
  });

  private syncAssignPermissionState = effect(() => {
    if (this.viewMode() !== 'assign') {
      return;
    }
    this.assignLoading.set(this.assignPermissionsResource.isLoading());
    if (this.assignPermissionsResource.hasValue()) {
      this.refreshCheckedStatus();
      this.cdr.markForCheck();
    }
  });

  /** 勾选绑定到角色的资源组 */
  private selectedPermissionIds = new Set<number>();
  allChecked = false;
  indeterminate = false;

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

  reloadRoleList(): void {
    this.rolesResource.reload();
  }

  selectedPermissionCount(): number {
    return this.selectedPermissionIds.size;
  }

  permissionListScroll(): { y: string } {
    return { y: '480px' };
  }

  addRole(): void {
    this.roleModalService
      .show({ nzTitle: '新增角色' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.rbacTestService
          .createRole(res.modalValue as RbacRolePayload)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.rolePageIndex.set(1);
            this.rolesResource.reload();
          });
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
            this.rbacTestService
              .updateRole(row.id, modalValue as RbacRolePayload)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => this.rolesResource.reload());
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
        this.rbacTestService
          .deleteRole(ids)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            ids.forEach(id => this.selectedRoleIds.delete(id));
            if (this.rolePageList().length === ids.length && this.rolePageIndex() > 1) {
              this.rolePageIndex.update(p => Math.max(1, p - 1));
            } else {
              this.rolesResource.reload();
            }
          });
      }
    });
  }

  searchRoles(): void {
    const keyword = this.listKeyword.trim();
    this.roleListFilters.set(keyword ? { keyword } : {});
    this.rolePageIndex.set(1);
  }

  resetRoleSearch(): void {
    this.listKeyword = '';
    this.roleListFilters.set({});
    this.rolePageIndex.set(1);
  }

  onRolePageIndexChange(index: number): void {
    this.rolePageIndex.set(index);
  }

  onRolePageSizeChange(size: number): void {
    this.rolePageSize.set(size);
    this.rolePageIndex.set(1);
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
          desc: `当前角色：${this.assignRoleName}${this.assignRoleDesc ? ` — ${this.assignRoleDesc}` : ''}`
        });
        this.assignKeyword = '';
        this.onlySelected.set(false);
        this.assignPermissionFilters.set({});
        this.selectedPermissionIds = new Set(role.permissionIds);
        this.viewMode.set('assign');
      });
  }

  readonly backToList = (): void => {
    this.viewMode.set('list');
    this.rolesResource.reload();
  };

  openPermissionConfig(row: RbacPermissionPageItem): void {
    void this.router.navigate(['/default/test/permission', row.id]);
  }

  searchPermissions(): void {
    const keyword = this.assignKeyword.trim();
    this.assignPermissionFilters.set(keyword ? { keyword } : {});
  }

  resetPermissionSearch(): void {
    this.assignKeyword = '';
    this.onlySelected.set(false);
    this.assignPermissionFilters.set({});
  }

  onOnlySelectedChange(checked: boolean): void {
    this.onlySelected.set(checked);
    this.cdr.markForCheck();
  }

  isPermissionChecked(row: RbacPermissionPageItem): boolean {
    return this.selectedPermissionIds.has(row.id);
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
