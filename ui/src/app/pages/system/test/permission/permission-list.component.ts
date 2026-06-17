import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { Menu } from '@core/services/types';
import { TestMenusService } from '@app/pages/system/test/menu/services/test-menus.service';
import { ApiResourceDTO } from '@services/system/api-resource.service';
import { RbacTestService } from '@services/system/rbac-test.service';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { ModalBtnStatus } from '@widget/base-modal';
import { ApiPickerModalService } from '@app/pages/system/test/shared/api-picker-modal/api-picker-modal.service';
import { MenuPickerModalService } from '@app/pages/system/test/shared/menu-picker-modal/menu-picker-modal.service';
import {
  buildLinkedMenuPreviewTree,
  extractPermissionMenuIds,
  MenuPickerTreeNodeOptions,
  normalizePermissionMenus,
  removeMenusFromSelection,
  resolvePermissionMenus
} from '../shared/permission-menu-tree.util';
import { PermissionApi, PermissionMenu, RbacPermission, RbacPermissionPageItem, RbacPermissionPayload, PermissionListFilters } from '../models/rbac.models';

import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTreeModule } from 'ng-zorro-antd/tree';

import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';

type ViewMode = 'list' | 'form';

@Component({
  selector: 'app-permission-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    NzTableModule,
    NzSpaceModule,
    NzSelectModule,
    NzModalModule,
    NzEmptyModule,
    NzAlertModule,
    NzDividerModule,
    NzTagModule,
    NzTooltipModule,
    NzSpinModule,
    NzTreeModule
  ],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.less'
})
export class PermissionListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private apiPickerModal = inject(ApiPickerModalService);
  private menuPickerModal = inject(MenuPickerModalService);
  private menusService = inject(TestMenusService);
  private rbacTestService = inject(RbacTestService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  viewMode = signal<ViewMode>('list');
  keyword = '';
  saving = signal(false);
  isEditMode = signal(false);
  menuCount = signal(0);
  apiCount = signal(0);

  menuFlatResource = this.menusService.getMenuListResource(() => ({
    pageSize: 0,
    pageIndex: 0,
    filters: {}
  }));

  menuFlatList = computed(() => {
    if (!this.menuFlatResource.hasValue()) {
      return [] as Menu[];
    }
    return [...this.menuFlatResource.value()];
  });

  private syncMenuFlatState = effect(() => {
    this.menuFlatLoading.set(this.menuFlatResource.isLoading());
    if (this.menuFlatResource.hasValue() && this.viewMode() === 'form') {
      this.refreshDisplayMenusFromIds({ onlyIfEmpty: true });
    }
    this.cdr.markForCheck();
  });

  menuFlatLoading = signal(false);
  displayMenus = signal<PermissionMenu[]>([]);
  linkedMenuExpandedKeys = signal<string[]>([]);

  linkedMenuTreeNodes = computed(() => {
    const menuIds = this.displayMenus()
      .map(m => Number(m.id))
      .filter(id => !Number.isNaN(id));
    if (!menuIds.length || !this.menuFlatList().length) {
      return [] as MenuPickerTreeNodeOptions[];
    }
    return buildLinkedMenuPreviewTree(this.menuFlatList(), menuIds);
  });

  private syncLinkedMenuTreeExpand = effect(() => {
    const nodes = this.linkedMenuTreeNodes();
    if (!nodes.length) {
      this.linkedMenuExpandedKeys.set([]);
      return;
    }
    this.linkedMenuExpandedKeys.set(this.collectTreeNodeKeys(nodes));
    this.cdr.markForCheck();
  });

  private listFilters = signal<PermissionListFilters>({});
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

  editingId?: number;
  editingContext = signal<{ id: number; name: string; code: string; module: string } | null>(null);
  form!: FormGroup;

  readonly listPageHeader: Partial<PageHeaderType> = {
    title: '权限资源组',
    desc: '组合 API 和菜单资源，形成可授权的权限组。'
  };

  readonly formPageHeader = signal<Partial<PageHeaderType>>({
    title: '新增权限',
    desc: ''
  });



  get apis(): FormArray {
    return this.form.get('apis') as FormArray;
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      module: ['', [Validators.required]],
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: [''],
      menuIds: [[] as number[]],
      apis: this.fb.array([])
    });
    this.form.valueChanges.subscribe(() => this.syncFormStats());
    this.displayMenus.set([]);
    this.syncFormStats();
  }

  menuTypeLabel(menuType: string | undefined): string {
    return menuType === 'F' ? '按钮' : '菜单';
  }

  menuTypeTagColor(menuType: string | undefined): string {
    return menuType === 'F' ? 'purple' : 'blue';
  }

  private collectTreeNodeKeys(nodes: NzTreeNodeOptions[]): string[] {
    const keys: string[] = [];
    const walk = (list: NzTreeNodeOptions[]) => {
      for (const node of list) {
        keys.push(String(node.key));
        if (node.children?.length) {
          walk(node.children);
        }
      }
    };
    walk(nodes);
    return keys;
  }

  private refreshDisplayMenusFromIds(options?: { onlyIfEmpty?: boolean }): void {
    const menuIds = (this.form?.get('menuIds')?.value as number[]) ?? [];
    if (!menuIds.length) {
      this.displayMenus.set([]);
      return;
    }
    if (options?.onlyIfEmpty && this.displayMenus().length) {
      return;
    }
    this.displayMenus.set(resolvePermissionMenus(menuIds, this.menuFlatList()));
  }

  /** 关联菜单 / 后端 API 预览表格固定滚动高度 */
  private readonly resourceTableScrollY = '520px';

  syncFormStats(): void {
    this.menuCount.set(this.displayMenus().length);
    this.apiCount.set(this.apis?.length ?? 0);
    this.cdr.markForCheck();
  }

  apiTableScroll(): { y?: string | null } {
    return this.apiCount() > 0 ? { y: this.resourceTableScrollY } : {};
  }

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

  openCreate(): void {
    this.editingId = undefined;
    this.editingContext.set(null);
    this.isEditMode.set(false);
    this.formPageHeader.set({
      title: '新增权限资源组',
      desc: '填写基本信息，并关联菜单与后端 API（后两项可选）。'
    });
    this.initForm();
    this.viewMode.set('form');
  }

  openEdit(row: RbacPermissionPageItem): void {
    this.rbacTestService
      .getPermission(row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => {
        if (!p) {
          this.message.warning('权限资源组不存在');
          return;
        }
        this.editingId = p.id;
        this.isEditMode.set(true);
        this.editingContext.set({
          id: p.id,
          name: p.name,
          code: p.code,
          module: p.module ?? ''
        });
        this.formPageHeader.set({
          title: '编辑权限资源组',
          desc: '修改下方表单内容，保存后生效。'
        });
        this.initForm();
        this.patchForm(p);
        this.viewMode.set('form');
        this.cdr.markForCheck();
      });
  }

  backToList(): void {
    this.viewMode.set('list');
    this.editingId = undefined;
    this.editingContext.set(null);
  }

  createApiGroup(api: Pick<PermissionApi, 'method' | 'path' | 'description'> & { id?: number }): FormGroup {
    return this.fb.group({
      id: [api.id ?? null],
      method: [api.method ?? ''],
      path: [api.path ?? ''],
      description: [api.description ?? '']
    });
  }

  patchForm(p: RbacPermission): void {
    this.apis.clear();
    if (p.apis && p.apis.length > 0) {
      p.apis.forEach(a => this.apis.push(this.createApiGroup(a)));
    }

    const menuIds = extractPermissionMenuIds(p);
    const menusFromApi = normalizePermissionMenus(p.menus);

    this.form.patchValue({
      module: p.module ?? '',
      code: p.code,
      name: p.name,
      description: p.description || '',
      menuIds
    });
    this.displayMenus.set(
      menusFromApi.length ? menusFromApi : resolvePermissionMenus(menuIds, this.menuFlatList())
    );
    this.syncFormStats();
  }

  manageMenus(): void {
    const previousIds = this.getExistingMenuIds();
    this.menuPickerModal
      .show({ nzTitle: '管理关联菜单', nzWidth: 920 }, { existingIds: previousIds, manageMode: true })
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        const selected = (res.modalValue ?? []) as Menu[];
        const menuIds = selected.map(m => Number(m.id)).filter(id => !Number.isNaN(id));
        this.applyMenuSelection(menuIds, previousIds);
      });
  }

  private applyMenuSelection(menuIds: number[], previousIds: number[]): void {
    this.form.patchValue({ menuIds });
    this.displayMenus.set(resolvePermissionMenus(menuIds, this.menuFlatList()));
    this.notifySelectionDiff(previousIds, menuIds, '菜单');
    this.syncFormStats();
    this.cdr.markForCheck();
  }

  removeMenu(menuId: number | string): void {
    const id = Number(menuId);
    const previousIds = this.getExistingMenuIds();
    const menuIds = removeMenusFromSelection([id], previousIds, this.menuFlatList());
    this.applyMenuSelection(menuIds, previousIds);
  }

  private getExistingMenuIds(): number[] {
    return [...((this.form.get('menuIds')?.value as number[]) ?? [])];
  }

  manageApis(): void {
    const previousIds = this.getExistingApiIds();
    this.apiPickerModal
      .show({ nzTitle: '管理关联 API', nzWidth: 920 }, { existingIds: previousIds, manageMode: true })
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        const selected = (res.modalValue ?? []) as ApiResourceDTO[];
        this.applyApiSelection(selected, previousIds);
      });
  }

  private applyApiSelection(selected: ApiResourceDTO[], previousIds: number[]): void {
    this.apis.clear();
    for (const api of selected) {
      if (api.id == null) {
        continue;
      }
      this.apis.push(
        this.createApiGroup({
          id: api.id,
          method: api.method,
          path: api.path,
          description: api.description ?? ''
        })
      );
    }
    const nextIds = selected.map(a => a.id).filter((id): id is number => id != null);
    this.notifySelectionDiff(previousIds, nextIds, 'API');
    this.form.updateValueAndValidity({ emitEvent: false });
    this.syncFormStats();
    this.cdr.markForCheck();
  }

  private notifySelectionDiff(previousIds: number[], nextIds: number[], label: string): void {
    const previousSet = new Set(previousIds);
    const nextSet = new Set(nextIds);
    const added = nextIds.filter(id => !previousSet.has(id)).length;
    const removed = previousIds.filter(id => !nextSet.has(id)).length;
    if (added || removed) {
      this.message.success(`已更新${label}：新增 ${added} 项，移除 ${removed} 项`);
      return;
    }
    this.message.info(`关联${label}未变更`);
  }

  private getExistingApiIds(): number[] {
    return this.apis.controls
      .map(c => (c.getRawValue() as PermissionApi).id)
      .filter((id): id is number => id != null);
  }

  removeApi(i: number): void {
    this.apis.removeAt(i);
    this.syncFormStats();
  }

  submitForm(): void {
    const invalidFields = ['module', 'code', 'name'].filter(key => this.form.get(key)?.invalid);
    if (invalidFields.length) {
      invalidFields.forEach(key => {
        const c = this.form.get(key);
        c?.markAsDirty();
        c?.updateValueAndValidity();
      });
      this.message.warning('请完善必填项');
      return;
    }

    const raw = this.form.getRawValue() as {
      module: string;
      code: string;
      name: string;
      description?: string;
      menuIds?: number[];
      apis?: PermissionApi[];
    };
    const apiIds = (raw.apis ?? [])
      .map(a => a.id)
      .filter((id): id is number => id != null);

    const payload: RbacPermissionPayload = {
      module: raw.module.trim(),
      code: raw.code,
      name: raw.name,
      description: raw.description,
      menuIds: raw.menuIds ?? [],
      apiIds
    };

    this.saving.set(true);
    const request$ =
      this.editingId != null
        ? this.rbacTestService.updatePermission(this.editingId, payload)
        : this.rbacTestService.createPermission(payload);

    request$
      .pipe(
        finalize(() => {
          this.saving.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.backToList();
          if (this.editingId != null) {
            this.permissionsResource.reload();
          } else {
            this.pageIndex.set(1);
            this.permissionsResource.reload();
          }
        },
        error: () => {
          /* needSuccessInfo / 业务错误由拦截器提示 */
        }
      });
  }

  remove(row: RbacPermissionPageItem): void {
    this.modal.confirm({
      nzTitle: '确认删除',
      nzContent: `删除权限组「${row.name}」？`,
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

  private resolveMenusFromIds(menuIds: number[]): PermissionMenu[] {
    return resolvePermissionMenus(menuIds, this.menuFlatList());
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
}
