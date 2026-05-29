import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { SearchCommonVO } from '@core/services/types';
import { ApiResourceDTO, ApiResourceSearchParam, ApiResourceService } from '@services/system/api-resource.service';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTreeModule } from 'ng-zorro-antd/tree';

import { NzTreeNodeKey, NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';

import {
  ApiPickerAddedFilter,
  ApiPickerSortBy,
  ApiPickerTreeNodeOptions,
  buildApiPickerTreeNodes,
  extractApiIdsFromCheckedKeys,
  filterApis,
  filterApisByAddedStatus,
  sortSelectedApis
} from './api-picker-tree.util';

export interface ApiPickerModalData {
  /** 已在表单中的 API 资源 id */
  existingIds?: number[];
}

@Component({
  selector: 'app-api-picker-modal',
  templateUrl: './api-picker-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzTreeModule,
    NzTagModule,
    NzSpinModule,
    NzEmptyModule,
    NzTooltipModule
  ],
  styles: `
    .picker-search {
      margin-bottom: 12px;
    }
    .picker-toolbar {
      margin-bottom: 8px;
    }
    .picker-panels {
      display: flex;
      gap: 12px;
      min-height: 420px;
    }
    .picker-panel {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      background: #fff;
    }
    .picker-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
    }
    .picker-panel-body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 8px 12px;
    }
    .picker-panel-hint {
      margin: 0;
      padding: 0 12px 8px;
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }
    .tree-node-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 100%;
    }
    .tree-node-path {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tree-node-desc {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }
    .tree-node-tag {
      flex-shrink: 0;
    }
    .selected-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .selected-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      background: #fafafa;
    }
    .selected-item-main {
      flex: 1;
      min-width: 0;
    }
    .selected-item-path {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }
    .selected-item-desc {
      margin-top: 2px;
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .selected-item-remove {
      flex-shrink: 0;
    }
    .panel-empty {
      padding: 24px 0;
    }
  `
})
export class ApiPickerModalComponent extends BasicConfirmModalComponent implements OnInit {
  readonly nzModalData: ApiPickerModalData = inject(NZ_MODAL_DATA, { optional: true }) ?? {};
  override modalRef = inject(NzModalRef);

  private apiService = inject(ApiResourceService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  searchParam: ApiResourceSearchParam = {};
  addedFilter: ApiPickerAddedFilter = 'notAdded';
  sortBy: ApiPickerSortBy = 'path';

  loading = signal(false);
  treeNodes = signal<ApiPickerTreeNodeOptions[]>([]);
  expandedKeys = signal<string[]>([]);
  checkedKeys = signal<string[]>([]);
  selectedList = signal<ApiResourceDTO[]>([]);
  filteredSelectableCount = signal(0);

  private allApis: ApiResourceDTO[] = [];
  private apiById = new Map<number, ApiResourceDTO>();
  private selectedById = new Map<number, ApiResourceDTO>();
  private existingIdSet = new Set<number>();

  readonly methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' }
  ];

  readonly addedFilterOptions: { label: string; value: ApiPickerAddedFilter }[] = [
    { label: '未添加', value: 'notAdded' },
    { label: '已添加', value: 'added' },
    { label: '全部', value: 'all' }
  ];

  readonly sortOptions: { label: string; value: ApiPickerSortBy }[] = [
    { label: '按路径', value: 'path' },
    { label: '按方法', value: 'method' }
  ];

  ngOnInit(): void {
    this.existingIdSet = new Set(this.nzModalData.existingIds ?? []);
    this.loadAllApis();
  }

  selectedCount(): number {
    return this.selectedById.size;
  }

  loadAllApis(): void {
    this.loading.set(true);
    const params: SearchCommonVO<ApiResourceSearchParam> = {
      pageIndex: 1,
      pageSize: 9999,
      filters: {}
    };

    this.apiService
      .getApiResourcePage(params)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.allApis = (data.list ?? []).filter(a => a.id != null);
        this.apiById = new Map(this.allApis.map(a => [a.id!, a]));
        this.applyTreeFilter();
      });
  }

  search(): void {
    this.applyTreeFilter();
  }

  resetSearch(): void {
    this.searchParam = {};
    this.addedFilter = 'notAdded';
    this.applyTreeFilter();
  }

  onAddedFilterChange(): void {
    this.applyTreeFilter();
  }

  onSortChange(): void {
    this.refreshSelectedList();
    this.cdr.markForCheck();
  }

  expandAll(): void {
    const keys: string[] = [];
    const walk = (nodes: NzTreeNodeOptions[]) => {
      for (const n of nodes) {
        keys.push(n.key as string);
        if (n.children?.length) {
          walk(n.children);
        }
      }
    };
    walk(this.treeNodes());
    this.expandedKeys.set(keys);
    this.cdr.markForCheck();
  }

  collapseAll(): void {
    this.expandedKeys.set([]);
    this.cdr.markForCheck();
  }

  selectAllFiltered(): void {
    const selectable = this.getFilteredApis().filter(a => a.id != null && !this.isExisting(a));
    if (!selectable.length) {
      this.message.info('当前筛选条件下没有可添加的 API');
      return;
    }
    for (const api of selectable) {
      this.selectedById.set(api.id!, api);
    }
    this.syncCheckedKeysFromSelection();
    this.refreshSelectedList();
    this.message.success(`已选中 ${selectable.length} 条 API`);
    this.cdr.markForCheck();
  }

  clearSelection(): void {
    if (!this.selectedById.size) {
      return;
    }
    this.selectedById.clear();
    this.checkedKeys.set([]);
    this.refreshSelectedList();
    this.cdr.markForCheck();
  }

  onCheckedKeysChange(keys: NzTreeNodeKey[]): void {
    const ids = extractApiIdsFromCheckedKeys(keys);
    const next = new Map<number, ApiResourceDTO>();
    for (const id of ids) {
      if (this.existingIdSet.has(id)) {
        continue;
      }
      const api = this.apiById.get(id);
      if (api) {
        next.set(id, api);
      }
    }
    this.selectedById = next;
    this.checkedKeys.set(ids.map(String));
    this.refreshSelectedList();
    this.cdr.markForCheck();
  }

  removeSelected(id: number): void {
    this.selectedById.delete(id);
    this.syncCheckedKeysFromSelection();
    this.refreshSelectedList();
    this.cdr.markForCheck();
  }

  isExistingOrigin(origin: ApiPickerTreeNodeOptions | null | undefined): boolean {
    return origin?.isExisting === true;
  }

  isGroupOrigin(origin: ApiPickerTreeNodeOptions | null | undefined): boolean {
    return origin?.isGroup === true;
  }

  groupSummary(origin: ApiPickerTreeNodeOptions): string {
    const selectable = origin.selectableCount ?? 0;
    const existing = origin.existingCount ?? 0;
    if (existing > 0) {
      return `${selectable} 可选，${existing} 已添加`;
    }
    return `${selectable} 条`;
  }

  protected getAsyncFnData(modalValue: unknown): Observable<unknown> {
    return of(modalValue);
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

  override getCurrentValue(): Observable<unknown> {
    const list = [...this.selectedById.values()];
    if (list.length === 0) {
      this.message.warning('请至少选择一条 API');
      return of(false);
    }
    return of(list);
  }

  private isExisting(row: ApiResourceDTO): boolean {
    return row.id != null && this.existingIdSet.has(row.id);
  }

  private getFilteredApis(): ApiResourceDTO[] {
    let filtered = filterApis(this.allApis, this.searchParam.keyword ?? '', this.searchParam.method);
    filtered = filterApisByAddedStatus(filtered, [...this.existingIdSet], this.addedFilter);
    return filtered;
  }

  private applyTreeFilter(): void {
    const filtered = this.getFilteredApis();
    const selectable = filtered.filter(a => a.id != null && !this.isExisting(a));
    this.filteredSelectableCount.set(selectable.length);
    this.treeNodes.set(buildApiPickerTreeNodes(filtered, [...this.existingIdSet]));

    if (this.searchParam.keyword?.trim() || this.searchParam.method || this.addedFilter !== 'all') {
      this.expandAll();
    }

    this.syncCheckedKeysFromSelection();
    this.refreshSelectedList();
    this.cdr.markForCheck();
  }

  private syncCheckedKeysFromSelection(): void {
    this.checkedKeys.set([...this.selectedById.keys()].map(String));
  }

  private refreshSelectedList(): void {
    this.selectedList.set(sortSelectedApis([...this.selectedById.values()], this.sortBy));
  }
}
