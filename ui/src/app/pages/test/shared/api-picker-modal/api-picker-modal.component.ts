import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { ApiResourceDTO, ApiResourceService } from '@services/system/api-resource.service';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { API_FALLBACK_MODULE, ApiPickerAddedFilter, catalogModule, filterApis, filterApisByAddedStatus, moduleLabel } from './api-picker-tree.util';

export interface ApiPickerModalData {
  /** 当前已关联的 API 资源 id，打开弹窗时预勾选 */
  existingIds?: number[];
  /** 管理模式：已关联项可取消勾选 */
  manageMode?: boolean;
}

type CatalogSelection = { kind: 'all' } | { kind: 'stale' } | { kind: 'module'; module: string };

@Component({
  selector: 'app-api-picker-modal',
  templateUrl: './api-picker-modal.component.html',
  styleUrl: './api-picker-modal.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, NzGridModule, NzInputModule, NzButtonModule, NzIconModule, NzSelectModule, NzTableModule, NzTagModule, NzSpinModule, NzTooltipModule]
})
export class ApiPickerModalComponent extends BasicConfirmModalComponent {
  readonly nzModalData: ApiPickerModalData = inject(NZ_MODAL_DATA, { optional: true }) ?? {};
  override modalRef = inject(NzModalRef);

  /** 嵌入配置页时传入；弹窗模式仍走 NZ_MODAL_DATA */
  readonly existingIds = input<number[] | null>(null);
  readonly manageModeInput = input<boolean | null>(null);
  /** 配置页把操作放到卡片标题栏，这里不再重复显示 */
  readonly showToolbar = input(true);

  private apiService = inject(ApiResourceService);
  private message = inject(NzMessageService);

  private apiResource = this.apiService.getApiResourceListResource(() => ({}));

  keywordDraft = '';
  methodDraft?: string;
  addedDraft: ApiPickerAddedFilter = 'all';

  private keyword = signal('');
  private method = signal<string | undefined>(undefined);
  private addedFilter = signal<ApiPickerAddedFilter>('all');
  private selection = signal<CatalogSelection>({ kind: 'all' });
  private apis = signal<ApiResourceDTO[]>([]);
  private selectedIds = signal<ReadonlySet<number>>(new Set());
  private lockedIds = new Set<number>();
  private apiById = new Map<number, ApiResourceDTO>();
  readonly selectionReady = signal(false);

  pageIndex = signal(1);
  pageSize = signal(10);
  manageMode = false;
  initialLinkedCount = 0;

  loading = computed(() => this.apiResource.isLoading());
  selectedCount = computed(() => this.selectedIds().size);

  private pool = computed(() => {
    const linked = [...this.selectedIds()];
    const matched = filterApis(this.apis(), this.keyword(), this.method());
    return filterApisByAddedStatus(matched, linked, this.addedFilter());
  });

  /** 模块和「全部」不展示未关联的已失效接口，避免保存时把已关联的失效接口悄悄丢掉 */
  private catalogApis = computed(() => {
    const linked = this.selectedIds();
    return this.pool().filter(api => api.status !== 'STALE' || (api.id != null && linked.has(api.id)));
  });

  moduleStats = computed(() => {
    const counts = new Map<string, number>();
    for (const api of this.catalogApis()) {
      const moduleName = catalogModule(api);
      if (moduleName === API_FALLBACK_MODULE) {
        continue;
      }
      counts.set(moduleName, (counts.get(moduleName) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([module, count]) => ({ module, count }));
  });

  totalCount = computed(() => this.catalogApis().length);

  otherCount = computed(() => this.catalogApis().filter(api => catalogModule(api) === API_FALLBACK_MODULE).length);

  staleCount = computed(() => this.pool().filter(api => api.status === 'STALE').length);

  filteredApis = computed(() => {
    const current = this.selection();
    let list: ApiResourceDTO[];
    if (current.kind === 'stale') {
      list = this.pool().filter(api => api.status === 'STALE');
    } else if (current.kind === 'module') {
      list = this.catalogApis().filter(api => catalogModule(api) === current.module);
    } else {
      list = this.catalogApis();
    }
    return [...list].sort((left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method));
  });

  pageRows = computed(() => {
    const start = (this.pageIndex() - 1) * this.pageSize();
    return this.filteredApis().slice(start, start + this.pageSize());
  });

  pageAllChecked = computed(() => {
    const rows = this.pageRows().filter(row => row.id != null);
    return rows.length > 0 && rows.every(row => this.selectedIds().has(row.id!));
  });

  pageIndeterminate = computed(() => {
    const rows = this.pageRows().filter(row => row.id != null);
    const checked = rows.filter(row => this.selectedIds().has(row.id!)).length;
    return checked > 0 && checked < rows.length;
  });

  readonly methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' }
  ];

  readonly addedFilterOptions: Array<{ label: string; value: ApiPickerAddedFilter }> = [
    { label: '全部', value: 'all' },
    { label: '未关联', value: 'notAdded' },
    { label: '已关联', value: 'added' }
  ];

  private syncApis = effect(() => {
    const fromInput = this.existingIds();
    const manageModeInput = this.manageModeInput();
    if (!this.apiResource.hasValue() || this.selectionReady()) {
      return;
    }
    const source = fromInput ?? this.nzModalData.existingIds ?? [];
    this.lockedIds = new Set(source.map(id => Number(id)).filter(id => !Number.isNaN(id)));
    this.initialLinkedCount = this.lockedIds.size;
    this.manageMode = manageModeInput ?? this.nzModalData.manageMode ?? this.lockedIds.size > 0;
    const list = (this.apiResource.value() ?? []).filter(api => api.id != null);
    this.apiById = new Map(list.map(api => [api.id!, api]));
    const next = new Set<number>();
    for (const id of this.lockedIds) {
      if (this.apiById.has(id)) {
        next.add(id);
      }
    }
    this.apis.set(list);
    this.selectedIds.set(next);
    this.selectionReady.set(true);
  });

  search(): void {
    this.keyword.set(this.keywordDraft.trim());
    this.method.set(this.methodDraft);
    this.pageIndex.set(1);
  }

  resetSearch(): void {
    this.keywordDraft = '';
    this.methodDraft = undefined;
    this.addedDraft = 'all';
    this.keyword.set('');
    this.method.set(undefined);
    this.addedFilter.set('all');
    this.selection.set({ kind: 'all' });
    this.pageIndex.set(1);
  }

  onAddedFilterChange(value: ApiPickerAddedFilter): void {
    this.addedFilter.set(value);
    this.pageIndex.set(1);
  }

  selectAll(): void {
    this.selection.set({ kind: 'all' });
    this.pageIndex.set(1);
  }

  selectModule(moduleName: string): void {
    this.selection.set({ kind: 'module', module: moduleName });
    this.pageIndex.set(1);
  }

  selectStale(): void {
    this.selection.set({ kind: 'stale' });
    this.pageIndex.set(1);
  }

  isAllSelected(): boolean {
    return this.selection().kind === 'all';
  }

  isStaleSelected(): boolean {
    return this.selection().kind === 'stale';
  }

  isModuleSelected(moduleName: string): boolean {
    const current = this.selection();
    return current.kind === 'module' && current.module === moduleName;
  }

  isChecked(id: number | undefined): boolean {
    return id != null && this.selectedIds().has(id);
  }

  isLocked(id: number | undefined): boolean {
    return !this.manageMode && id != null && this.lockedIds.has(id);
  }

  onRowChecked(api: ApiResourceDTO, checked: boolean): void {
    if (api.id == null || this.isLocked(api.id)) {
      return;
    }
    this.updateSelection(next => {
      if (checked) {
        next.add(api.id!);
      } else {
        next.delete(api.id!);
      }
    });
  }

  onPageChecked(checked: boolean): void {
    const rows = this.pageRows().filter(row => row.id != null && !this.isLocked(row.id));
    this.updateSelection(next => {
      for (const row of rows) {
        if (checked) {
          next.add(row.id!);
        } else {
          next.delete(row.id!);
        }
      }
    });
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
  }

  selectFiltered(): void {
    const rows = this.filteredApis().filter(row => row.id != null);
    if (rows.length === 0) {
      this.message.info('当前筛选条件下没有可选接口');
      return;
    }
    this.updateSelection(next => {
      for (const row of rows) {
        next.add(row.id!);
      }
    });
    this.message.success(`已选中 ${rows.length} 条接口`);
  }

  clearSelection(): void {
    if (this.selectedIds().size === 0) {
      return;
    }
    if (this.manageMode) {
      this.selectedIds.set(new Set());
      return;
    }
    const kept = new Set<number>();
    for (const id of this.lockedIds) {
      if (this.apiById.has(id)) {
        kept.add(id);
      }
    }
    this.selectedIds.set(kept);
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

  moduleText(moduleName: string): string {
    return moduleLabel(moduleName);
  }

  protected getAsyncFnData(modalValue: unknown): Observable<unknown> {
    return of(modalValue);
  }

  selectedApiIds(): number[] {
    return [...this.selectedIds()];
  }

  override getCurrentValue(): Observable<unknown> {
    const selected = [...this.selectedIds()].map(id => this.apiById.get(id)).filter((api): api is ApiResourceDTO => api != null);
    return of(selected);
  }

  private updateSelection(change: (next: Set<number>) => void): void {
    const next = new Set(this.selectedIds());
    change(next);
    this.selectedIds.set(next);
  }
}
