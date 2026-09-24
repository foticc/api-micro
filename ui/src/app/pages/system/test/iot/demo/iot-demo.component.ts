import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { DemoSgd1 } from '@app/pages/system/test/iot/demo/models/demo-sgd1.models';
import { DemoSgd1Service } from '@app/pages/system/test/iot/demo/services/demo-sgd1.service';
import { AntTableComponent, AntTableConfig, SortFile } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-iot-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, FormsModule, NzCardModule, NzFormModule, NzGridModule, NzInputModule, NzButtonModule, NzWaveModule, NzIconModule, NzDatePickerModule, CardTableWrapComponent, AntTableComponent],
  templateUrl: './iot-demo.component.html'
})
export class IotDemoComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');

  private dataService = inject(DemoSgd1Service);
  private modalSrv = inject(NzModalService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  private readonly initialRange = defaultRange();
  start: Date | null = this.initialRange.start;
  end: Date | null = this.initialRange.end;

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
      start: this.requestStart(),
      end: this.requestEnd()
    }
  }));

  dataList = computed(() => {
    if (this.pageResource.hasValue()) {
      return [...this.pageResource.value().list];
    }
    return [] as DemoSgd1[];
  });

  tableConfig = signal<AntTableConfig>({
    headers: [
      { title: '时间', field: 'time', width: 210, showSort: true },
      { title: '温度', field: 'temperature', width: 120, showSort: true },
      { title: '湿度', field: 'humidity', width: 120, showSort: true }
    ],
    total: 0,
    showCheckbox: false,
    loading: false,
    pageSize: 20,
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
    title: 'IoTDB 联调',
    desc: 'DemoSgd1（root.sg.d1）。默认查询当前日期前 7 天到后 7 天，表头点击排序。'
  };

  ngAfterViewInit(): void {
    this.tableConfig.update(c => ({
      ...c,
      loading: this.pageResource.isLoading(),
      headers: [
        ...c.headers,
        { title: '操作', tdTemplate: this.operationTpl(), width: 90, fixed: true, fixedDir: 'right', notNeedEllipsis: true }
      ]
    }));
  }

  search(): void {
    if (!this.start || !this.end) {
      this.message.warning('请选择开始和结束时间');
      return;
    }
    if (this.start.getTime() > this.end.getTime()) {
      this.message.warning('开始时间不能晚于结束时间');
      return;
    }
    this.requestStart.set(formatDateTime(this.start));
    this.requestEnd.set(formatDateTime(this.end));
    this.requestPageIndex.set(1);
  }

  changeSort(e: SortFile): void {
    this.requestSort.set(e.sortDir ? `${e.fileName},${e.sortDir}` : undefined);
    this.requestPageIndex.set(1);
    this.tableConfig.update(c => ({
      ...c,
      headers: c.headers.map(h => ({
        ...h,
        sortDir: h.field === e.fileName ? e.sortDir : undefined
      }))
    }));
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

  save(): void {
    this.dataService
      .save()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pageResource.reload());
  }

  del(row: DemoSgd1): void {
    this.modalSrv.confirm({
      nzTitle: `确定删除 ${row.time} 的测点吗？`,
      nzOnOk: () =>
        this.dataService
          .delete(row)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.pageResource.reload())
    });
  }
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
