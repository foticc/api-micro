import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { IotDevice, IotDeviceQuery } from '../../device/models/iot-device.models';
import { IotDeviceService } from '../../device/services/iot-device.service';
import { AntTableComponent, AntTableConfig } from '@shared/components/ant-table/ant-table.component';
import { BasicConfirmModalComponent, ModalBtnStatus } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-iot-device-picker-modal',
  templateUrl: './iot-device-picker-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, NzGridModule, NzInputModule, NzButtonModule, NzWaveModule, NzIconModule, AntTableComponent]
})
export class IotDevicePickerModalComponent extends BasicConfirmModalComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly statusTpl = viewChild.required<TemplateRef<NzSafeAny>>('statusTpl');

  override modalRef = inject(NzModalRef);
  private deviceService = inject(IotDeviceService);

  searchParam: IotDeviceQuery = {};
  private selected: IotDevice | null = inject(NZ_MODAL_DATA, { optional: true });
  private requestPageSize = signal(10);
  private requestPageIndex = signal(1);
  private searchFilters = signal<IotDeviceQuery>({});

  pageResource = this.deviceService.getPageResource(() => ({
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
    showCheckbox: false,
    loading: false,
    pageSize: 10,
    pageIndex: 1
  });

  private syncTableConfig = effect(() => {
    const isLoading = this.pageResource.isLoading();
    const hasValue = this.pageResource.hasValue();
    this.tableConfig.update(config => ({
      ...config,
      loading: isLoading,
      ...(hasValue
        ? {
            total: this.pageResource.value().total,
            pageIndex: this.pageResource.value().pageIndex,
            pageSize: this.pageResource.value().pageSize
          }
        : {})
    }));
  });

  override getCurrentValue(): Observable<NzSafeAny> {
    return of(this.selected ?? false);
  }

  ngAfterViewInit(): void {
    this.tableConfig.update(config => ({
      ...config,
      headers: [
        { title: '序列号', field: 'serialNo', width: 160 },
        { title: '昵称', field: 'nickname', width: 140 },
        { title: 'IoTDB 路径', field: 'iotdbPath', width: 220 },
        { title: '状态', field: 'status', width: 90, tdTemplate: this.statusTpl(), notNeedEllipsis: true },
        { title: '操作', tdTemplate: this.operationTpl(), width: 80, fixed: true, fixedDir: 'right', notNeedEllipsis: true }
      ]
    }));
  }

  search(): void {
    this.searchFilters.set({ ...this.searchParam });
    this.requestPageIndex.set(1);
  }

  getDataList(pageIndex: number): void {
    this.requestPageIndex.set(pageIndex);
  }

  changePageSize(size: number): void {
    this.requestPageSize.set(size);
    this.requestPageIndex.set(1);
  }

  choose(row: IotDevice): void {
    this.modalRef.destroy({ status: ModalBtnStatus.Ok, modalValue: row });
  }
}

function omitEmpty(filters: IotDeviceQuery): IotDeviceQuery {
  const result: IotDeviceQuery = {};
  const serialNo = filters.serialNo?.trim();
  const nickname = filters.nickname?.trim();
  if (serialNo) {
    result.serialNo = serialNo;
  }
  if (nickname) {
    result.nickname = nickname;
  }
  return result;
}
