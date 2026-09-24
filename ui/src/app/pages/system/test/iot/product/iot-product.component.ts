import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { IOT_STATUS_OPTIONS, IotProduct, IotProductQuery, IotTslModel } from '@app/pages/system/test/iot/product/models/iot-product.models';
import { IotProductModalService } from '@app/pages/system/test/iot/product/services/iot-product-modal.service';
import { IotProductService } from '@app/pages/system/test/iot/product/services/iot-product.service';
import { IotTslModalService } from '@app/pages/system/test/iot/product/services/iot-tsl-modal.service';
import { AntTableComponent, AntTableConfig } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
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
  selector: 'app-iot-product',
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
  templateUrl: './iot-product.component.html'
})
export class IotProductComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly statusTpl = viewChild.required<TemplateRef<NzSafeAny>>('statusTpl');

  private dataService = inject(IotProductService);
  private modalService = inject(IotProductModalService);
  private tslModalService = inject(IotTslModalService);
  private modalSrv = inject(NzModalService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  searchParam: IotProductQuery = {};
  checkedCashArray: IotProduct[] = [];
  readonly statusOptions = IOT_STATUS_OPTIONS;

  private requestPageSize = signal(10);
  private requestPageIndex = signal(1);
  private searchFilters = signal<IotProductQuery>({});

  pageResource = this.dataService.getPageResource(() => ({
    pageSize: this.requestPageSize(),
    pageIndex: this.requestPageIndex(),
    filters: omitEmpty(this.searchFilters())
  }));

  dataList = computed(() => {
    if (this.pageResource.hasValue()) {
      return [...this.pageResource.value().list];
    }
    return [] as IotProduct[];
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
    title: 'IoT 产品',
    desc: '产品档案与物模型，接口前缀 /api/v1/iot/products。'
  };

  ngAfterViewInit(): void {
    this.initTable();
  }

  selectedChecked(rows: IotProduct[]): void {
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
  }

  add(): void {
    this.modalService
      .show({ nzTitle: '新增产品' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.dataService
          .create(res.modalValue as IotProduct)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.requestPageIndex.set(1);
            this.pageResource.reload();
          });
      });
  }

  edit(row: IotProduct): void {
    this.dataService
      .getDetail(row.id!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        this.modalService
          .show({ nzTitle: '编辑产品' }, detail)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            this.dataService
              .update(row.id!, modalValue as IotProduct)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => this.pageResource.reload());
          });
      });
  }

  publishTsl(row: IotProduct): void {
    this.tslModalService
      .show({ nzTitle: `发布物模型：${row.name}`, nzWidth: 720 }, { productId: row.id!, productName: row.name })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ modalValue, status }) => {
        if (status === ModalBtnStatus.Cancel) {
          return;
        }
        const body = modalValue as Pick<IotTslModel, 'schemaJson' | 'changelog'>;
        this.dataService
          .publishTsl(row.id!, body)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.pageResource.reload());
      });
  }

  openDevices(row: IotProduct): void {
    this.router.navigate(['/default/system/test/iot/device'], { queryParams: { productId: row.id } });
  }

  allDel(): void {
    if (this.checkedCashArray.length === 0) {
      this.message.warning('请勾选要删除的数据');
      return;
    }
    const ids = this.checkedCashArray.map(row => row.id!).filter(id => id != null);
    this.modalSrv.confirm({
      nzTitle: '确定要批量删除吗？',
      nzContent: '删除后产品不再出现在列表中',
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
      nzContent: '删除后产品不再出现在列表中',
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
        { title: '产品标识', field: 'productKey', width: 140 },
        { title: '名称', field: 'name', width: 140 },
        { title: '认证', field: 'authType', width: 90 },
        { title: '路径模板', field: 'iotdbPathPattern', width: 240 },
        { title: '物模型版本', field: 'currentTslVersion', width: 110 },
        { title: '状态', field: 'status', width: 90, tdTemplate: this.statusTpl(), notNeedEllipsis: true },
        { title: '创建时间', field: 'createdAt', width: 170, pipe: 'date:yyyy-MM-dd HH:mm' },
        { title: '操作', tdTemplate: this.operationTpl(), width: 220, fixed: true, fixedDir: 'right', notNeedEllipsis: true }
      ],
      total: 0,
      loading: true,
      pageSize: 10,
      pageIndex: 1
    });
  }
}

function omitEmpty(filters: IotProductQuery): IotProductQuery {
  const result: IotProductQuery = {};
  if (filters.productKey) {
    result.productKey = filters.productKey;
  }
  if (filters.name) {
    result.name = filters.name;
  }
  if (filters.status) {
    result.status = filters.status;
  }
  return result;
}
