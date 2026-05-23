import { Component, ChangeDetectionStrategy, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ActionCode } from '@app/config/actionCode';
import { SearchCommonVO } from '@core/services/types';
import { DictDTO, DictItemDTO, DictService } from '@services/system/dict.service';
import { AntTableConfig } from '@shared/components/ant-table/ant-table.component';
import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { AuthDirective } from '@shared/directives/auth.directive';
import { ModalBtnStatus } from '@widget/base-modal';
import { DictItemModalService } from '@widget/biz-widget/system/dict-item-modal/dict-item-modal.service';
import { DictModalService } from '@widget/biz-widget/system/dict-modal/dict-modal.service';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';

interface DictSearchParam {
  keyword: string;
}

@Component({
  selector: 'app-dict',
  templateUrl: './dict.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .dict-type-search {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
      }
      .dict-nested-cell {
        padding: 12px 16px 16px !important;
        background: #fafafa;
      }
      .dict-nested-toolbar {
        margin-bottom: 10px;
      }
      .dict-nested-table {
        background: #fff;
      }
    `
  ],
  imports: [
    PageHeaderComponent,
    NzGridModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    NzCardModule,
    NzTableModule,
    AuthDirective,
    NzEmptyModule
  ]
})
export class DictComponent {
  ActionCode = ActionCode;
  searchParam: Partial<DictSearchParam> = {};
  destroyRef = inject(DestroyRef);

  readonly pageHeaderInfo: Partial<PageHeaderType> = {
    title: '字典管理',
    breadcrumb: ['首页', '系统管理', '字典管理']
  };

  dictDataList = signal<DictDTO[]>([]);
  /** 当前展开的字典类型 id */
  private expandedDictIds = signal(new Set<number>());
  /** 字典项缓存：dictId -> 列表 */
  private itemItemsByDictId = signal(new Map<number, DictItemDTO[]>());
  /** 正在加载字典项的 dictId */
  private itemLoadIds = signal(new Set<number>());

  dictTableConfig = signal<AntTableConfig>({
    headers: [],
    total: 0,
    showCheckbox: false,
    loading: false,
    pageSize: 10,
    pageIndex: 1,
    showPagination: true,
    needNoScroll: true
  });

  private dictService = inject(DictService);
  private dictModalService = inject(DictModalService);
  private dictItemModalService = inject(DictItemModalService);
  private modalSrv = inject(NzModalService);
  private message = inject(NzMessageService);

  constructor() {
    this.getDictList();
  }

  isDictExpanded(id?: number): boolean {
    return id != null && this.expandedDictIds().has(id);
  }

  onDictExpandChange(dictId: number | undefined, expanded: boolean): void {
    if (dictId == null) return;
    const next = new Set(this.expandedDictIds());
    if (expanded) {
      next.add(dictId);
      this.expandedDictIds.set(next);
      this.ensureItemsLoaded(dictId);
    } else {
      next.delete(dictId);
      this.expandedDictIds.set(next);
    }
  }

  itemsForDict(dictId: number): DictItemDTO[] {
    return this.itemItemsByDictId().get(dictId) ?? [];
  }

  itemsLoadingFor(dictId: number): boolean {
    return this.itemLoadIds().has(dictId);
  }

  /** 首次展开拉取；已有缓存则跳过 */
  ensureItemsLoaded(dictId: number): void {
    if (this.itemItemsByDictId().has(dictId)) return;
    this.fetchItemsForDict(dictId);
  }

  /** 强制重新拉取某类型的字典项 */
  refreshItemsForDict(dictId: number): void {
    this.fetchItemsForDict(dictId);
  }

  private fetchItemsForDict(dictId: number): void {
    const loading = new Set(this.itemLoadIds());
    loading.add(dictId);
    this.itemLoadIds.set(loading);
    this.dictService
      .getDictItemList(dictId)
      .pipe(
        finalize(() => {
          const l = new Set(this.itemLoadIds());
          l.delete(dictId);
          this.itemLoadIds.set(l);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(list => {
        const m = new Map(this.itemItemsByDictId());
        m.set(dictId, [...list]);
        this.itemItemsByDictId.set(m);
      });
  }

  onDictPageIndexChange(pageIndex: number): void {
    this.dictTableConfig.update(c => ({ ...c, pageIndex }));
    this.getDictList();
  }

  onDictPageSizeChange(pageSize: number): void {
    this.dictTableConfig.update(c => ({ ...c, pageSize, pageIndex: 1 }));
    this.getDictList({ pageIndex: 1 });
  }

  dictTableLoading(v: boolean): void {
    this.dictTableConfig.update(c => ({ ...c, loading: v }));
  }

  getDictList(e?: { pageIndex: number }): void {
    this.dictTableLoading(true);
    if (e?.pageIndex != null) {
      this.dictTableConfig.update(c => ({ ...c, pageIndex: e.pageIndex! }));
    }
    const cfg = this.dictTableConfig();
    const params: SearchCommonVO<NzSafeAny> = {
      pageSize: cfg.pageSize!,
      pageIndex: cfg.pageIndex!,
      filters: this.searchParam
    };
    this.dictService
      .getDictPage(params)
      .pipe(
        finalize(() => this.dictTableLoading(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        const { list, total, pageIndex } = data;
        const idSet = new Set(list.map(d => d.id!).filter(Boolean));

        this.dictDataList.set([...list]);
        this.dictTableConfig.update(c => ({ ...c, total: total!, pageIndex: pageIndex! }));

        const prunedItems = new Map(
          [...this.itemItemsByDictId().entries()].filter(([k]) => idSet.has(k))
        );
        this.itemItemsByDictId.set(prunedItems);

        this.expandedDictIds.update(s => new Set([...s].filter(id => idSet.has(id))));
      });
  }

  resetDictSearch(): void {
    this.searchParam = {};
    this.dictTableConfig.update(c => ({ ...c, pageIndex: 1 }));
    this.getDictList({ pageIndex: 1 });
  }

  addDict(): void {
    this.dictModalService
      .show({ nzTitle: '新增字典类型' })
      .pipe(finalize(() => this.dictTableLoading(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) return;
        this.dictTableLoading(true);
        this.dictService
          .addDict(res.modalValue as DictDTO)
          .pipe(finalize(() => this.dictTableLoading(false)), takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.getDictList({ pageIndex: 1 }));
      });
  }

  editDict(id: number): void {
    this.dictService
      .getDictDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        this.dictModalService
          .show({ nzTitle: '编辑字典类型' }, detail)
          .pipe(finalize(() => this.dictTableLoading(false)), takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) return;
            const param = { ...(modalValue as DictDTO), id };
            this.dictTableLoading(true);
            this.dictService
              .editDict(param)
              .pipe(finalize(() => this.dictTableLoading(false)), takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                this.invalidateItemsCache(id);
                this.getDictList();
              });
          });
      });
  }

  delDict(id: number): void {
    this.modalSrv.confirm({
      nzTitle: '确定删除该字典类型？',
      nzContent: '将同时移除其下所有字典项，且不可恢复',
      nzOnOk: () => {
        this.dictTableLoading(true);
        this.dictService
          .delDict([id])
          .pipe(finalize(() => this.dictTableLoading(false)), takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.removeItemsCache(id);
            this.expandedDictIds.update(s => {
              const n = new Set(s);
              n.delete(id);
              return n;
            });
            if (this.dictDataList().length === 1 && this.dictTableConfig().pageIndex !== 1) {
              this.dictTableConfig.update(c => ({ ...c, pageIndex: c.pageIndex! - 1 }));
            }
            this.getDictList();
          });
      }
    });
  }

  addItem(dictId: number): void {
    this.dictItemModalService
      .show({ nzTitle: '新增字典项' }, { dictId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) return;
        this.dictService
          .addDictItem(res.modalValue as DictItemDTO)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.refreshItemsForDict(dictId));
      });
  }

  editItem(id: number, dictId: number): void {
    this.dictService
      .getDictItemDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        this.dictItemModalService
          .show({ nzTitle: '编辑字典项' }, { dictId, record: detail })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) return;
            const param = { ...(modalValue as DictItemDTO), id, dictId };
            this.dictService
              .editDictItem(param)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => this.refreshItemsForDict(dictId));
          });
      });
  }

  delItem(id: number, dictId: number): void {
    this.modalSrv.confirm({
      nzTitle: '确定删除该字典项？',
      nzOnOk: () => {
        this.dictService
          .delDictItem([id])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.refreshItemsForDict(dictId));
      }
    });
  }

  private invalidateItemsCache(dictId: number): void {
    const m = new Map(this.itemItemsByDictId());
    m.delete(dictId);
    this.itemItemsByDictId.set(m);
    if (this.expandedDictIds().has(dictId)) {
      this.fetchItemsForDict(dictId);
    }
  }

  private removeItemsCache(dictId: number): void {
    const m = new Map(this.itemItemsByDictId());
    m.delete(dictId);
    this.itemItemsByDictId.set(m);
  }
}
