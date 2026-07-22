import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { TestMenusService } from '@app/pages/system/test/menu/services/test-menus.service';
import {
  buildMenuPickerTreeNodes,
  collectDescendantIds,
  filterFlatMenus,
  filterFlatMenusByAddedStatus,
  getExplicitCheckedIds,
  getMenuTreeDisplayCheckedKeys,
  MenuPickerAddedFilter,
  MenuPickerTreeNodeOptions,
  reconcileMenuSelectionFromTreeChecked
} from '@app/pages/system/test/shared/permission-menu-tree.util';
import { Menu } from '@core/services/types';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormatEmitEvent, NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTreeModule } from 'ng-zorro-antd/tree';

export interface MenuPickerModalData {
  /** 当前已关联的 menu.id，打开弹窗时预勾选 */
  existingIds?: number[];
  /** 管理模式：已关联项可取消勾选 */
  manageMode?: boolean;
}

@Component({
  selector: 'app-menu-picker-modal',
  templateUrl: './menu-picker-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, NzGridModule, NzInputModule, NzSelectModule, NzButtonModule, NzIconModule, NzTreeModule, NzTagModule, NzSpinModule],
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
    .tree-node-tag {
      margin-left: 8px;
    }
    .tree-node-extra {
      margin-left: 8px;
    }
  `
})
export class MenuPickerModalComponent extends BasicConfirmModalComponent implements OnInit {
  readonly nzModalData: MenuPickerModalData = inject(NZ_MODAL_DATA, { optional: true }) ?? {};
  override modalRef = inject(NzModalRef);

  private menusService = inject(TestMenusService);
  private cdr = inject(ChangeDetectorRef);

  searchKeyword = '';
  addedFilter: MenuPickerAddedFilter = 'all';
  readonly addedFilterOptions: Array<{ label: string; value: MenuPickerAddedFilter }> = [
    { label: '全部', value: 'all' },
    { label: '未关联', value: 'notAdded' },
    { label: '已关联', value: 'added' }
  ];
  treeNodes = signal<NzTreeNodeOptions[]>([]);
  expandedKeys = signal<string[]>([]);
  checkedKeys = signal<string[]>([]);

  menuResource = this.menusService.getMenuListResource(() => ({
    pageSize: 0,
    pageIndex: 0,
    filters: {}
  }));

  loading = computed(() => this.menuResource.isLoading());
  manageMode = false;

  private allFlatMenus: Menu[] = [];
  private menuById = new Map<number, Menu>();
  private selectedById = new Map<number, Menu>();
  private initialLinkedIds: number[] = [];
  private selectionInitialized = false;
  /** 用户直接勾选（含向下级联）的节点，不含仅为展示而补的祖先 */
  private explicitCheckedIds: number[] = [];

  private syncMenuTree = effect(() => {
    if (!this.menuResource.hasValue()) {
      return;
    }
    this.allFlatMenus = [...this.menuResource.value()];
    this.menuById = new Map(this.allFlatMenus.map(m => [Number(m.id), m]));
    this.initializeSelectionIfNeeded();
    this.applyTreeFilter();
  });

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
    this.searchKeyword = '';
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

  clearSelection(): void {
    if (!this.selectedById.size) {
      return;
    }
    this.selectedById.clear();
    this.explicitCheckedIds = [];
    this.checkedKeys.set([]);
    this.cdr.markForCheck();
  }

  onCheckboxChange(event: NzFormatEmitEvent): void {
    const node = event.node;
    if (!node?.key) {
      return;
    }
    const id = Number(node.key);
    if (Number.isNaN(id) || !this.menuById.has(id)) {
      return;
    }

    const nextExplicit = new Set(this.explicitCheckedIds);
    const affectedIds = collectDescendantIds([id], this.allFlatMenus);

    if (node.isChecked) {
      for (const descId of affectedIds) {
        nextExplicit.add(descId);
      }
    } else {
      for (const descId of affectedIds) {
        nextExplicit.delete(descId);
      }
    }

    this.updateSelectionFromExplicit([...nextExplicit]);
  }

  isMenuLinked(origin: MenuPickerTreeNodeOptions | null | undefined): boolean {
    if (!origin?.menu?.id) {
      return false;
    }
    return this.selectedById.has(Number(origin.menu.id));
  }

  protected getAsyncFnData(modalValue: unknown): Observable<unknown> {
    return of(modalValue);
  }

  override getCurrentValue(): Observable<unknown> {
    return of([...this.selectedById.values()]);
  }

  private initializeSelectionIfNeeded(): void {
    if (this.selectionInitialized) {
      return;
    }
    const reconciledIds = reconcileMenuSelectionFromTreeChecked(this.initialLinkedIds, this.allFlatMenus);
    for (const id of reconciledIds) {
      const menu = this.menuById.get(id);
      if (menu) {
        this.selectedById.set(id, menu);
      }
    }
    this.selectionInitialized = true;
    this.syncCheckedKeysFromSelection();
  }

  private updateSelectionFromExplicit(explicitIds: number[]): void {
    this.explicitCheckedIds = explicitIds;

    const reconciledIds = reconcileMenuSelectionFromTreeChecked(explicitIds, this.allFlatMenus);
    const next = new Map<number, Menu>();
    for (const id of reconciledIds) {
      const menu = this.menuById.get(id);
      if (menu) {
        next.set(id, menu);
      }
    }
    this.selectedById = next;
    this.syncTreeCheckedKeys();
    this.cdr.markForCheck();
  }

  private syncCheckedKeysFromSelection(): void {
    this.explicitCheckedIds = getExplicitCheckedIds([...this.selectedById.keys()], this.allFlatMenus);
    this.syncTreeCheckedKeys();
  }

  private syncTreeCheckedKeys(): void {
    const displayKeys = getMenuTreeDisplayCheckedKeys(this.explicitCheckedIds, this.allFlatMenus);
    this.checkedKeys.set(displayKeys.map(String));
  }

  private applyTreeFilter(syncCheckedKeys = true): void {
    const linkedIds = [...this.selectedById.keys()];
    let filtered = filterFlatMenus(this.allFlatMenus, this.searchKeyword);
    filtered = filterFlatMenusByAddedStatus(filtered, linkedIds, this.addedFilter);
    this.treeNodes.set(buildMenuPickerTreeNodes(filtered, linkedIds, { manageMode: this.manageMode }));

    if (this.searchKeyword.trim() || this.addedFilter !== 'all') {
      this.expandAll();
    }

    if (syncCheckedKeys) {
      this.syncTreeCheckedKeys();
    }
    this.cdr.markForCheck();
  }
}
