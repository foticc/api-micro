import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Menu } from '@core/services/types';
import { MenusService } from '@services/system/menus.service';
import {
  buildMenuPickerTreeNodes,
  filterFlatMenus,
  filterFlatMenusByAddedStatus,
  MenuPickerAddedFilter,
  MenuPickerTreeNodeOptions
} from '@app/pages/system/test/shared/permission-menu-tree.util';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTreeModule } from 'ng-zorro-antd/tree';

import { NzTreeNodeKey, NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';

export interface MenuPickerModalData {
  /** 已在表单中的 menu.id */
  existingIds?: number[];
}

@Component({
  selector: 'app-menu-picker-modal',
  templateUrl: './menu-picker-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzTreeModule,
    NzTagModule,
    NzSpinModule
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

  private menusService = inject(MenusService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  searchKeyword = '';
  addedFilter: MenuPickerAddedFilter = 'all';
  readonly addedFilterOptions: { label: string; value: MenuPickerAddedFilter }[] = [
    { label: '全部', value: 'all' },
    { label: '未添加', value: 'notAdded' },
    { label: '已添加', value: 'added' }
  ];
  loading = signal(false);
  treeNodes = signal<NzTreeNodeOptions[]>([]);
  expandedKeys = signal<string[]>([]);
  checkedKeys = signal<string[]>([]);

  private allFlatMenus: Menu[] = [];
  private menuById = new Map<number, Menu>();
  private selectedById = new Map<number, Menu>();
  private existingIdSet = new Set<number>();

  ngOnInit(): void {
    this.existingIdSet = new Set(this.nzModalData.existingIds ?? []);
    this.loadMenus();
  }

  selectedCount(): number {
    return this.selectedById.size;
  }

  loadMenus(): void {
    this.loading.set(true);
    this.menusService
      .getMenuList({ pageIndex: 0, pageSize: 0, filters: {} })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(list => {
        this.allFlatMenus = [...list];
        this.menuById = new Map(this.allFlatMenus.map(m => [Number(m.id), m]));
        this.applyTreeFilter();
      });
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

  onCheckedKeysChange(keys: NzTreeNodeKey[]): void {
    const keyStrings = keys.map(k => String(k));
    const next = new Map<number, Menu>();
    for (const key of keyStrings) {
      const id = Number(key);
      if (Number.isNaN(id) || this.existingIdSet.has(id)) {
        continue;
      }
      const menu = this.menuById.get(id);
      if (menu) {
        next.set(id, menu);
      }
    }
    this.selectedById = next;
    this.checkedKeys.set(keyStrings.filter(k => !this.existingIdSet.has(Number(k))));
    this.cdr.markForCheck();
  }

  isExistingOrigin(origin: MenuPickerTreeNodeOptions | null | undefined): boolean {
    return origin?.isExisting === true;
  }

  protected getAsyncFnData(modalValue: unknown): Observable<unknown> {
    return of(modalValue);
  }

  override getCurrentValue(): Observable<unknown> {
    const list = [...this.selectedById.values()];
    if (list.length === 0) {
      this.message.warning('请至少选择一条菜单');
      return of(false);
    }
    return of(list);
  }

  private applyTreeFilter(): void {
    let filtered = filterFlatMenus(this.allFlatMenus, this.searchKeyword);
    filtered = filterFlatMenusByAddedStatus(filtered, [...this.existingIdSet], this.addedFilter);
    const nodes = buildMenuPickerTreeNodes(filtered, [...this.existingIdSet]);
    this.treeNodes.set(nodes);
    if (this.searchKeyword.trim() || this.addedFilter !== 'all') {
      this.expandAll();
    }
    this.cdr.markForCheck();
  }
}
