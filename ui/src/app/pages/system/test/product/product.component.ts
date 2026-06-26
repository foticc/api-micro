import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { ProductParam, ProductQueryParam, ProductVO } from '@app/pages/system/test/product/models/product.models';
import { ProductModalService } from '@app/pages/system/test/product/services/product-modal.service';
import { ProductService } from '@app/pages/system/test/product/services/product.service';
import { OptionsInterface } from '@core/services/types';
import { AntTableComponent, AntTableConfig } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { MapKeyType, MapPipe, MapSet } from '@shared/pipes/map.pipe';
import { ModalBtnStatus } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-product',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    NzSelectModule,
    NzTagModule,
    CardTableWrapComponent,
    AntTableComponent
  ],
  templateUrl: './product.component.html'
})
export class ProductComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly enabledTpl = viewChild.required<TemplateRef<NzSafeAny>>('enabledTpl');

  private dataService = inject(ProductService);
  private modalService = inject(ProductModalService);
  private modalSrv = inject(NzModalService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  searchParam: ProductQueryParam = {};
  checkedCashArray: ProductVO[] = [];
  isCollapse = true;
  readonly enabledOptions: OptionsInterface[] = [...MapPipe.transformMapToArray(MapSet.available, MapKeyType.Boolean)];

  private requestPageSize = signal(10);
  private requestPageIndex = signal(1);
  private searchFilters = signal<ProductQueryParam>({});

  pageResource = this.dataService.getPageResource(() => ({
    pageSize: this.requestPageSize(),
    pageIndex: this.requestPageIndex(),
    filters: { ...this.searchFilters() }
  }));

  dataList = computed(() => {
    if (this.pageResource.hasValue()) {
      return [...this.pageResource.value().list];
    }
    return [] as ProductVO[];
  });

  tableConfig = signal<AntTableConfig>({
    headers: [],
    total: 0,
    showCheckbox: true,
    loading: false,
    pageSize: 10,
    pageIndex: 1
  });

  private syncTableConfig = effect(() => {
    const isLoading = this.pageResource.isLoading();
    const hasValue = this.pageResource.hasValue();
    this.tableConfig.update(c => ({
      ...c,
      loading: isLoading,
      ...(hasValue
        ? {
            total: this.pageResource.value().total!,
            pageIndex: this.pageResource.value().pageIndex!,
            pageSize: this.pageResource.value().pageSize!
          }
        : {})
    }));
  });

  readonly pageHeaderInfo: Partial<PageHeaderType> = {
    title: 'Product（测试）',
    desc: 'Product CRUD，接口前缀 /demo/generated/product。'
  };

  ngAfterViewInit(): void {
    this.initTable();
  }

  selectedChecked(rows: ProductVO[]): void {
    this.checkedCashArray = [...rows];
  }

  getDataList(pageIndex: number): void {
    this.searchFilters.set({ ...this.searchParam });
    this.requestPageIndex.set(pageIndex);
  }

  resetForm(): void {
    this.searchParam = {};
    this.searchFilters.set({});
    this.requestPageIndex.set(1);
  }

  changePageSize(size: number): void {
    this.requestPageSize.set(size);
    this.requestPageIndex.set(1);
  }

  reloadTable(): void {
    this.pageResource.reload();
    this.message.info('刷新成功');
  }

  toggleCollapse(): void {
    this.isCollapse = !this.isCollapse;
  }

  add(): void {
    this.modalService
      .show({ nzTitle: '新增' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.dataService
          .create(res.modalValue as ProductParam)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.requestPageIndex.set(1);
              this.pageResource.reload();
            },
            error: err => this.showError(err)
          });
      });
  }

  edit(id: number): void {
    this.dataService
      .getDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        if (!detail) {
          return;
        }
        this.modalService
          .show({ nzTitle: '编辑' }, detail)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            const param = modalValue as ProductParam;
            this.dataService
              .update(id, param)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => this.pageResource.reload(),
                error: err => this.showError(err)
              });
          });
      });
  }

  allDel(): void {
    if (this.checkedCashArray.length === 0) {
      this.message.warning('请勾选要删除的数据');
      return;
    }
    const ids = this.checkedCashArray.map(row => row.id!).filter(id => id != null);
    this.modalSrv.confirm({
      nzTitle: '确定要批量删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () =>
        this.dataService
          .delete(ids)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.checkedCashArray = [];
            this.pageResource.reload();
          })
    });
  }

  del(id: number): void {
    this.modalSrv.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () =>
        this.dataService
          .delete([id])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.requestPageIndex.update(p => Math.max(1, p - 1));
            } else {
              this.pageResource.reload();
            }
          })
    });
  }

  private initTable(): void {
    this.tableConfig.set({
      showCheckbox: true,
      headers: [
        { title: '标题', field: 'title', width: 120 },
        { title: '价格', field: 'price', width: 120 },
        { title: '是否启用', field: 'enabled', width: 100, tdTemplate: this.enabledTpl(), notNeedEllipsis: true },
        { title: '创建人', field: 'createdBy', width: 100 },
        { title: '创建时间', field: 'createdAt', width: 170, pipe: 'date:yyyy-MM-dd HH:mm' },
        { title: '更新人', field: 'lastModifiedBy', width: 100 },
        { title: '更新时间', field: 'updatedAt', width: 170, pipe: 'date:yyyy-MM-dd HH:mm' },
        { title: '操作', tdTemplate: this.operationTpl(), width: 140, fixed: true, fixedDir: 'right' }
      ],
      total: 0,
      loading: true,
      pageSize: 10,
      pageIndex: 1
    });
  }

  private showError(err: NzSafeAny): void {
    const msg = err?.error?.msg || err?.message;
    if (msg) {
      this.message.warning(msg);
    }
  }
}
