import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { ApiResourceDTO, ApiResourceSearchParam, ApiResourceService } from '@services/system/api-resource.service';
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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTreeModule } from 'ng-zorro-antd/tree';

import { NzTreeNodeKey, NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';

import {
  ApiPickerAddedFilter,
  ApiPickerTreeNodeOptions,
  buildApiPickerTreeNodes,
  extractApiIdsFromCheckedKeys,
  filterApis,
  filterApisByAddedStatus
} from './api-picker-tree.util';

export interface ApiPickerModalData {
  /** 当前已关联的 API 资源 id，打开弹窗时预勾选 */
  existingIds?: number[];
  /** 管理模式：已关联项可取消勾选 */
  manageMode?: boolean;
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
    NzTooltipModule
  ],
  styles: `
    .picker-search {
      margin-bottom: 12px;
    }
    .picker-summary {
      margin-bottom: 12px;
      color: rgba(0, 0, 0, 0.45);
      font-size: 13px;
    }
    .picker-tree-toolbar {
      margin-bottom: 8px;
    }
    .picker-tree-scroll {
      max-height: 460px;
      overflow: auto;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      padding: 8px 12px;
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
    .tree-node-extra {
      margin-left: 4px;
    }
  `
})
export class ApiPickerModalComponent extends BasicConfirmModalComponent implements OnInit {
  readonly nzModalData: ApiPickerModalData = inject(NZ_MODAL_DATA, { optional: true }) ?? {};
  override modalRef = inject(NzModalRef);

  private apiService = inject(ApiResourceService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  searchParam: ApiResourceSearchParam = {};
  addedFilter: ApiPickerAddedFilter = 'all';
  manageMode = false;

  apiResource = this.apiService.getApiResourcePageResource(() => ({
    pageIndex: 1,
    pageSize: 9999,
    filters: {}
  }));

  loading = computed(() => this.apiResource.isLoading());

  treeNodes = signal<ApiPickerTreeNodeOptions[]>([]);
  expandedKeys = signal<string[]>([]);
  checkedKeys = signal<string[]>([]);

  private allApis: ApiResourceDTO[] = [];
  private apiById = new Map<number, ApiResourceDTO>();
  private selectedById = new Map<number, ApiResourceDTO>();
  private initialLinkedIds: number[] = [];
  private selectionInitialized = false;

  private syncApiTree = effect(() => {
    if (!this.apiResource.hasValue()) {
      return;
    }
    this.allApis = (this.apiResource.value().list ?? []).filter(a => a.id != null);
    this.apiById = new Map(this.allApis.map(a => [a.id!, a]));
    this.initializeSelectionIfNeeded();
    this.applyTreeFilter();
  });

  readonly methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' }
  ];

  readonly addedFilterOptions: { label: string; value: ApiPickerAddedFilter }[] = [
    { label: '全部', value: 'all' },
    { label: '未关联', value: 'notAdded' },
    { label: '已关联', value: 'added' }
  ];

  ngOnInit(): void {
    this.initialLinkedIds = (this.nzModalData.existingIds ?? []).map(id => Number(id)).filter(id => !Number.isNaN(id));
    this.manageMode = this.nzModalData.manageMode ?? this.initialLinkedIds.length > 0;
  }

  selectedCount(): number {
    return this.selectedById.size;
  }

  initialLinkedCount(): number {
    return this.initialLinkedIds.length;
  }

  search(): void {
    this.applyTreeFilter();
  }

  resetSearch(): void {
    this.searchParam = {};
    this.addedFilter = 'all';
    this.applyTreeFilter();
  }

  onAddedFilterChange(): void {
    this.applyTreeFilter();
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
    const selectable = this.getFilteredApis().filter(a => a.id != null);
    if (!selectable.length) {
      this.message.info('当前筛选条件下没有可选 API');
      return;
    }
    for (const api of selectable) {
      this.selectedById.set(api.id!, api);
    }
    this.syncCheckedKeysFromSelection();
    this.message.success(`已选中 ${selectable.length} 条 API`);
    this.cdr.markForCheck();
  }

  clearSelection(): void {
    if (!this.selectedById.size) {
      return;
    }
    this.selectedById.clear();
    this.checkedKeys.set([]);
    this.cdr.markForCheck();
  }

  onCheckedKeysChange(keys: NzTreeNodeKey[]): void {
    const ids = extractApiIdsFromCheckedKeys(keys);
    const next = new Map<number, ApiResourceDTO>();
    for (const id of ids) {
      const api = this.apiById.get(id);
      if (api) {
        next.set(id, api);
      }
    }
    this.selectedById = next;
    this.syncCheckedKeysFromSelection();
    this.cdr.markForCheck();
  }

  isApiLinked(origin: ApiPickerTreeNodeOptions | null | undefined): boolean {
    if (!origin?.api?.id) {
      return false;
    }
    return this.selectedById.has(origin.api.id);
  }

  isGroupOrigin(origin: ApiPickerTreeNodeOptions | null | undefined): boolean {
    return origin?.isGroup === true;
  }

  groupSummary(origin: ApiPickerTreeNodeOptions): string {
    const total = origin.children?.length ?? origin.selectableCount ?? 0;
    const linked = origin.existingCount ?? 0;
    if (linked > 0) {
      return `${total} 条，已关联 ${linked}`;
    }
    return `${total} 条`;
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
    return of([...this.selectedById.values()]);
  }

  private initializeSelectionIfNeeded(): void {
    if (this.selectionInitialized) {
      return;
    }
    for (const id of this.initialLinkedIds) {
      const api = this.apiById.get(id);
      if (api) {
        this.selectedById.set(id, api);
      }
    }
    this.selectionInitialized = true;
    this.syncCheckedKeysFromSelection();
  }

  private getFilteredApis(): ApiResourceDTO[] {
    const linkedIds = [...this.selectedById.keys()];
    let filtered = filterApis(this.allApis, this.searchParam.keyword ?? '', this.searchParam.method);
    filtered = filterApisByAddedStatus(filtered, linkedIds, this.addedFilter);
    return filtered;
  }

  private applyTreeFilter(syncCheckedKeys = true): void {
    const linkedIds = [...this.selectedById.keys()];
    const filtered = this.getFilteredApis();
    this.treeNodes.set(buildApiPickerTreeNodes(filtered, linkedIds, { manageMode: this.manageMode }));

    if (this.searchParam.keyword?.trim() || this.searchParam.method || this.addedFilter !== 'all') {
      this.expandAll();
    }

    if (syncCheckedKeys) {
      this.syncCheckedKeysFromSelection();
    }
    this.cdr.markForCheck();
  }

  private syncCheckedKeysFromSelection(): void {
    this.checkedKeys.set([...this.selectedById.keys()].map(String));
  }
}
