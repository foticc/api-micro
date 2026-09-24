import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DeviceSample, IOT_STATUS_OPTIONS, IotDevice, IotDeviceQuery } from '@app/pages/system/test/iot/device/models/iot-device.models';
import { IotDeviceModalService } from '@app/pages/system/test/iot/device/services/iot-device-modal.service';
import { IotDeviceService } from '@app/pages/system/test/iot/device/services/iot-device.service';
import { IotProduct } from '@app/pages/system/test/iot/product/models/iot-product.models';
import { IotProductService } from '@app/pages/system/test/iot/product/services/iot-product.service';
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
  selector: 'app-iot-device',
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
  templateUrl: './iot-device.component.html'
})
export class IotDeviceComponent implements OnInit, AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly statusTpl = viewChild.required<TemplateRef<NzSafeAny>>('statusTpl');
  readonly productTpl = viewChild.required<TemplateRef<NzSafeAny>>('productTpl');

  private dataService = inject(IotDeviceService);
  private productService = inject(IotProductService);
  private modalService = inject(IotDeviceModalService);
  private modalSrv = inject(NzModalService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly products = signal<IotProduct[]>([]);
  readonly statusOptions = IOT_STATUS_OPTIONS;
  searchParam: IotDeviceQuery = {};
  checkedCashArray: IotDevice[] = [];

  private requestPageSize = signal(10);
  private requestPageIndex = signal(1);
  private searchFilters = signal<IotDeviceQuery>({});

  pageResource = this.dataService.getPageResource(() => ({
    pageSize: this.requestPageSize(),
    pageIndex: this.requestPageIndex(),
    filters: omitEmpty(this.searchFilters())
  }));

  dataList = computed(() => {
    if (this.pageResource.hasValue()) {
      return [...this.pageResource.value().list];
    }
    return [] as IotDevice[];
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
    title: 'IoT 设备',
    desc: '设备档案，接口前缀 /api/v1/iot/devices。创建设备前产品需已发布物模型。'
  };

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.queryParamMap.get('productId'));
    if (productId) {
      this.searchParam = { productId };
      this.searchFilters.set({ productId });
    }
    this.productService
      .page({ pageIndex: 1, pageSize: 200, filters: {} })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(page => this.products.set(page?.list ?? []));
  }

  ngAfterViewInit(): void {
    this.initTable();
  }

  productName(productId: number): string {
    return this.products().find(item => item.id === productId)?.name ?? String(productId);
  }

  selectedChecked(rows: IotDevice[]): void {
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
    const preset = this.searchParam.productId ? ({ productId: this.searchParam.productId } as IotDevice) : undefined;
    this.modalService
      .show({ nzTitle: '新增设备' }, preset)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.dataService
          .create(res.modalValue as IotDevice)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(created => {
            this.showSecret(created.deviceSecret, '设备已创建，密钥只显示一次');
            this.requestPageIndex.set(1);
            this.pageResource.reload();
          });
      });
  }

  edit(row: IotDevice): void {
    this.dataService
      .getDetail(row.id!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        this.modalService
          .show({ nzTitle: '编辑设备' }, detail)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            this.dataService
              .update(row.id!, modalValue as IotDevice)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => this.pageResource.reload());
          });
      });
  }

  toggleStatus(row: IotDevice): void {
    const action = row.status === 'ENABLED' ? this.dataService.disable(row.id!) : this.dataService.enable(row.id!);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.pageResource.reload());
  }

  resetSecret(row: IotDevice): void {
    this.modalSrv.confirm({
      nzTitle: '重置设备密钥？',
      nzContent: '旧密钥立即失效，新密钥只显示一次',
      nzOnOk: () =>
        this.dataService
          .resetSecret(row.id!)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(result => this.showSecret(result.deviceSecret, '新密钥只显示一次'))
    });
  }

  openProperties(row: IotDevice): void {
    this.router.navigate(['/default/system/test/iot/property'], { queryParams: { deviceId: row.id } });
  }

  upgradeTsl(row: IotDevice): void {
    this.modalSrv.confirm({
      nzTitle: '升级到产品当前物模型？',
      nzContent: '只改这台设备绑定的物模型版本。设备固件需已支持新测点，否则新属性没有数据。',
      nzOnOk: () =>
        this.dataService
          .upgradeTsl(row.id!)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.pageResource.reload())
    });
  }

  insertSample(row: IotDevice): void {
    this.dataService
      .sample(row.id!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(sample => this.showSample(sample));
  }

  allDel(): void {
    if (this.checkedCashArray.length === 0) {
      this.message.warning('请勾选要删除的数据');
      return;
    }
    const ids = this.checkedCashArray.map(row => row.id!).filter(id => id != null);
    this.modalSrv.confirm({
      nzTitle: '确定要批量删除吗？',
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

  private showSample(sample: DeviceSample): void {
    const lines = Object.entries(sample.values ?? {}).map(([key, value]) => `${key}: ${value}`);
    this.modalSrv.info({
      nzTitle: `已写入 ${sample.time ?? ''}`,
      nzContent: lines.join('，') || '无测点',
      nzWidth: 420
    });
  }

  private showSecret(secret: string | undefined, title: string): void {
    if (!secret) {
      return;
    }
    this.modalSrv.info({
      nzTitle: title,
      nzContent: secret,
      nzWidth: 520
    });
  }

  private initTable(): void {
    this.tableConfig.set({
      showCheckbox: true,
      headers: [
        { title: '序列号', field: 'serialNo', width: 160 },
        { title: '昵称', field: 'nickname', width: 120 },
        { title: '产品', field: 'productId', width: 140, tdTemplate: this.productTpl() },
        { title: 'IoTDB 路径', field: 'iotdbPath', width: 220 },
        { title: '物模型', field: 'tslVersion', width: 90 },
        { title: '固件', field: 'fwVersion', width: 100 },
        { title: '状态', field: 'status', width: 90, tdTemplate: this.statusTpl(), notNeedEllipsis: true },
        { title: '创建时间', field: 'createdAt', width: 170, pipe: 'date:yyyy-MM-dd HH:mm' },
        { title: '操作', tdTemplate: this.operationTpl(), width: 420, fixed: true, fixedDir: 'right', notNeedEllipsis: true }
      ],
      total: 0,
      loading: true,
      pageSize: 10,
      pageIndex: 1
    });
  }
}

function omitEmpty(filters: IotDeviceQuery): IotDeviceQuery {
  const result: IotDeviceQuery = {};
  if (filters.productId) {
    result.productId = filters.productId;
  }
  if (filters.serialNo) {
    result.serialNo = filters.serialNo;
  }
  if (filters.nickname) {
    result.nickname = filters.nickname;
  }
  if (filters.status) {
    result.status = filters.status;
  }
  return result;
}
