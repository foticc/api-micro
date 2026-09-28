import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { IotDevice } from '../device/models/iot-device.models';
import { IotDeviceService } from '../device/services/iot-device.service';
import { PropertySeriesColumn } from './models/iot-property.models';
import { IotDevicePickerModalService } from './device-picker-modal/iot-device-picker-modal.service';
import { IotPropertyService } from './services/iot-property.service';
import { AntTableComponent, AntTableConfig, SortFile, TableHeader } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { ModalBtnStatus } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-iot-property',
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
    NzDatePickerModule,
    CardTableWrapComponent,
    AntTableComponent
  ],
  templateUrl: './iot-property.component.html'
})
export class IotPropertyComponent implements OnInit {
  private dataService = inject(IotPropertyService);
  private deviceService = inject(IotDeviceService);
  private picker = inject(IotDevicePickerModalService);
  private route = inject(ActivatedRoute);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  private readonly initialRange = defaultRange();
  start: Date | null = this.initialRange.start;
  end: Date | null = this.initialRange.end;

  readonly device = signal<IotDevice | null>(null);
  readonly deviceLabel = computed(() => labelOf(this.device()));
  private readonly deviceId = signal<number | null>(null);
  readonly tableTitle = signal('测点');
  private requestPageSize = signal(20);
  private requestPageIndex = signal(1);
  private requestSort = signal<string | undefined>(undefined);
  private requestStart = signal(formatDateTime(this.initialRange.start));
  private requestEnd = signal(formatDateTime(this.initialRange.end));

  pageResource = this.dataService.getPageResource(() => ({
    pageSize: this.requestPageSize(),
    pageIndex: this.requestPageIndex(),
    sort: this.requestSort(),
    filters: {
      deviceId: this.deviceId() ?? undefined,
      start: this.requestStart(),
      end: this.requestEnd()
    }
  }));

  readonly dataList = computed(() => {
    if (!this.pageResource.hasValue()) {
      return [] as Record<string, string>[];
    }
    const columns = this.pageResource.value().columns ?? [];
    return this.pageResource.value().list.map(row => toTableRow(row.time, row.values, columns));
  });

  tableConfig = signal<AntTableConfig>({
    headers: [{ title: '时间', field: 'time', width: 210, showSort: true }],
    total: 0,
    showCheckbox: false,
    loading: false,
    pageSize: 20,
    pageIndex: 1
  });

  private syncTableConfig = effect(() => {
    const isLoading = this.pageResource.isLoading();
    const hasValue = this.pageResource.hasValue();
    const columns = hasValue ? (this.pageResource.value().columns ?? []) : [];
    const sort = this.requestSort();
    this.tableConfig.update(config => ({
      ...config,
      loading: isLoading,
      headers: buildHeaders(columns, sort),
      ...(hasValue
        ? {
            total: this.pageResource.value().total,
            pageIndex: this.pageResource.value().pageIndex,
            pageSize: this.pageResource.value().pageSize
          }
        : {})
    }));
  });

  readonly pageHeaderInfo: Partial<PageHeaderType> = {
    title: 'IoT 测点',
    desc: '选择设备后，查询时间范围内的全部测点。默认当前日期前 7 天到后 7 天，表头点击排序。没有值显示为 -。'
  };

  ngOnInit(): void {
    const deviceId = Number(this.route.snapshot.queryParamMap.get('deviceId'));
    if (deviceId) {
      this.deviceService
        .getDetail(deviceId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(detail => {
          this.device.set(detail);
          this.applyDevice(detail.id!, labelOf(detail));
        });
    }
  }

  chooseDevice(): void {
    this.picker
      .show({ nzTitle: '选择设备', nzWidth: 920 }, this.device() ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel || !res.modalValue) {
          return;
        }
        this.device.set(res.modalValue as IotDevice);
      });
  }

  search(): void {
    const current = this.device();
    if (!current?.id) {
      this.message.warning('请选择设备');
      return;
    }
    if (!this.start || !this.end) {
      this.message.warning('请选择开始和结束时间');
      return;
    }
    if (this.start.getTime() > this.end.getTime()) {
      this.message.warning('开始时间不能晚于结束时间');
      return;
    }
    this.applyDevice(current.id, labelOf(current));
  }

  changeSort(e: SortFile): void {
    this.requestSort.set(e.sortDir ? `${e.fileName},${e.sortDir}` : undefined);
    this.requestPageIndex.set(1);
  }

  changePageSize(size: number): void {
    this.requestPageSize.set(size);
    this.requestPageIndex.set(1);
  }

  getDataList(pageIndex: number): void {
    this.requestPageIndex.set(pageIndex);
  }

  reloadTable(): void {
    this.pageResource.reload();
  }

  private applyDevice(id: number, serialNo: string): void {
    if (!this.start || !this.end) {
      return;
    }
    this.tableTitle.set(serialNo);
    this.requestStart.set(formatDateTime(this.start));
    this.requestEnd.set(formatDateTime(this.end));
    this.requestSort.set(undefined);
    this.requestPageIndex.set(1);
    this.deviceId.set(id);
  }
}

function buildHeaders(columns: PropertySeriesColumn[], sort: string | undefined): TableHeader[] {
  return [
    { title: '时间', field: 'time', width: 210, showSort: true, sortDir: sortDirOf(sort, 'time') },
    ...columns.map(column => ({
      title: column.name || column.identifier,
      field: column.identifier,
      width: 140,
      showSort: true,
      sortDir: sortDirOf(sort, column.identifier)
    }))
  ];
}

function sortDirOf(sort: string | undefined, field: string): 'asc' | 'desc' | undefined {
  if (!sort) {
    return undefined;
  }
  const [name, dir] = sort.split(',');
  if (name !== field) {
    return undefined;
  }
  return dir === 'asc' || dir === 'desc' ? dir : undefined;
}

function toTableRow(time: string | undefined, values: Record<string, unknown> | undefined, columns: PropertySeriesColumn[]): Record<string, string> {
  const row: Record<string, string> = { time: time || '-' };
  for (const column of columns) {
    row[column.identifier] = display(values?.[column.identifier]);
  }
  return row;
}

function labelOf(device: IotDevice | null): string {
  if (!device) {
    return '';
  }
  const nickname = device.nickname?.trim();
  if (nickname && nickname !== device.serialNo) {
    return `${nickname}（${device.serialNo}）`;
  }
  return device.serialNo;
}

function display(value: unknown): string {
  if (value == null || value === '') {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function defaultRange(): { start: Date; end: Date } {
  const today = new Date();
  return {
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 0, 0, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 23, 59, 59)
  };
}

function formatDateTime(value: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}
