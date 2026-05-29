import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { Menu } from '@core/services/types';
import { MenusService } from '@services/system/menus.service';
import { ApiResourceDTO } from '@services/system/api-resource.service';
import { RbacTestService } from '@services/system/rbac-test.service';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { ModalBtnStatus } from '@widget/base-modal';
import { ApiPickerModalService } from '@app/pages/system/test/shared/api-picker-modal/api-picker-modal.service';
import { MenuPickerModalService } from '@app/pages/system/test/shared/menu-picker-modal/menu-picker-modal.service';
import {
  extractPermissionMenuIds,
  expandMenuIdsWithAncestors,
  normalizePermissionMenus,
  resolvePermissionMenus
} from '../shared/permission-menu-tree.util';
import { PermissionApi, PermissionMenu, RbacPermission, RbacPermissionPageItem, RbacPermissionPayload } from '../models/rbac.models';

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
    NzSpinModule
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
  private menusService = inject(MenusService);
  private rbacTestService = inject(RbacTestService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  viewMode = signal<ViewMode>('list');
  keyword = '';
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  menuCount = signal(0);
  apiCount = signal(0);

  menuFlatList = signal<Menu[]>([]);
  menuFlatLoading = signal(false);
  displayMenus = signal<PermissionMenu[]>([]);

  pageList = signal<RbacPermissionPageItem[]>([]);
  total = signal(0);
  pageIndex = signal(1);
  pageSize = signal(10);

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
    this.loadPage();
    this.loadMenuFlatList();
  }

  /** 缓存全量菜单，供 menuIds 解析展示名称 */
  loadMenuFlatList(): void {
    this.menuFlatLoading.set(true);
    this.menusService
      .getMenuList({ pageIndex: 0, pageSize: 0, filters: {} })
      .pipe(
        finalize(() => {
          this.menuFlatLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(list => {
        this.menuFlatList.set([...list]);
        if (this.viewMode() === 'form') {
          this.refreshDisplayMenusFromIds({ onlyIfEmpty: true });
        }
      });
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

  linkedMenus(): PermissionMenu[] {
    return this.displayMenus();
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

  syncFormStats(): void {
    this.menuCount.set(this.displayMenus().length);
    this.apiCount.set(this.apis?.length ?? 0);
    this.cdr.markForCheck();
  }

  apiTableScroll(): { y?: string | null } {
    return this.apiCount() > 0 ? { y: '360px' } : {};
  }

  menuTableScroll(): { y?: string | null } {
    return this.menuCount() > 0 ? { y: '360px' } : {};
  }

  loadPage(pageIndex = this.pageIndex()): void {
    this.loading.set(true);
    const keyword = this.keyword.trim();
    this.rbacTestService
      .listPermissionsPage({
        pageIndex,
        pageSize: this.pageSize(),
        filters: keyword ? { keyword } : {}
      })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.pageList.set(data.list);
        this.total.set(data.total);
        this.pageIndex.set(data.pageIndex);
        this.pageSize.set(data.pageSize);
      });
  }

  search(): void {
    this.loadPage(1);
  }

  resetSearch(): void {
    this.keyword = '';
    this.loadPage(1);
  }

  onPageIndexChange(index: number): void {
    this.loadPage(index);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.loadPage(1);
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

  addMenu(): void {
    this.menuPickerModal
      .show({ nzTitle: '选择菜单', nzWidth: 920 }, { existingIds: this.getExistingMenuIds() })
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        const selected = (res.modalValue ?? []) as Menu[];
        const selectedIds = selected.map(m => Number(m.id)).filter(id => !Number.isNaN(id));
        const expandedIds = expandMenuIdsWithAncestors(selectedIds, this.menuFlatList());

        const existingIds = new Set(this.getExistingMenuIds());
        const addedIds: number[] = [];
        for (const id of expandedIds) {
          if (existingIds.has(id)) {
            continue;
          }
          existingIds.add(id);
          addedIds.push(id);
        }
        if (addedIds.length > 0) {
          const menuIds = [...addedIds, ...this.getExistingMenuIds()];
          this.form.patchValue({ menuIds });
          this.displayMenus.set(resolvePermissionMenus(menuIds, this.menuFlatList()));
          this.message.success(`已添加 ${addedIds.length} 项菜单`);
        }
        this.syncFormStats();
        this.cdr.markForCheck();
      });
  }

  removeMenu(menuId: number | string): void {
    const id = Number(menuId);
    const menuIds = ((this.form.get('menuIds')?.value as number[]) ?? []).filter(mid => mid !== id);
    this.form.patchValue({ menuIds });
    this.refreshDisplayMenusFromIds();
    this.syncFormStats();
  }

  private getExistingMenuIds(): number[] {
    return [...((this.form.get('menuIds')?.value as number[]) ?? [])];
  }

  addApi(): void {
    this.apiPickerModal
      .show({ nzTitle: '选择 API 资源', nzWidth: 1150 }, { existingIds: this.getExistingApiIds() })
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        const selected = (res.modalValue ?? []) as ApiResourceDTO[];
        const existingIds = new Set(this.getExistingApiIds());
        let added = 0;
        for (const api of selected) {
          if (api.id == null || existingIds.has(api.id)) {
            continue;
          }
          existingIds.add(api.id);
          this.apis.push(
            this.createApiGroup({
              id: api.id,
              method: api.method,
              path: api.path,
              description: api.description ?? ''
            })
          );
          added++;
        }
        if (added > 0) {
          this.message.success(`已添加 ${added} 条 API`);
          this.form.updateValueAndValidity({ emitEvent: false });
        }
        this.syncFormStats();
        this.cdr.markForCheck();
      });
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
    const pageToLoad = this.editingId != null ? this.pageIndex() : 1;
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
          this.loadPage(pageToLoad);
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
            next: () => this.loadPage(this.pageIndex())
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
