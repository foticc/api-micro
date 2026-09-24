import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { IotDevice } from '@app/pages/system/test/iot/device/models/iot-device.models';
import { IotDeviceService } from '@app/pages/system/test/iot/device/services/iot-device.service';
import { PropertyHistory, PropertyLatest } from '@app/pages/system/test/iot/property/models/iot-property.models';
import { IotPropertyService } from '@app/pages/system/test/iot/property/services/iot-property.service';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

type RangePreset = '1h' | '24h' | '7d' | 'custom';

@Component({
  selector: 'app-iot-property',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    NzDatePickerModule,
    NzTableModule,
    NzSelectModule,
    NzRadioModule,
    NzDescriptionsModule,
    NzEmptyModule,
    NzTagModule
  ],
  templateUrl: './iot-property.component.html',
  styles: `
    .property-row {
      cursor: pointer;
    }

    .property-row-active > td {
      background: #e6f4ff;
    }
  `
})
export class IotPropertyComponent implements OnInit {
  private dataService = inject(IotPropertyService);
  private deviceService = inject(IotDeviceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  readonly devices = signal<IotDevice[]>([]);
  readonly device = signal<IotDevice | null>(null);
  readonly latestList = signal<PropertyLatest[]>([]);
  readonly historyResult = signal<PropertyHistory | null>(null);
  readonly latestLoading = signal(false);
  readonly historyLoading = signal(false);
  readonly deviceId = signal<number | null>(null);
  readonly identifier = signal('');
  readonly rangePreset = signal<RangePreset>('24h');
  private latestToken = 0;
  private historyToken = 0;

  from: Date | null = null;
  to: Date | null = null;

  readonly pageHeaderInfo: Partial<PageHeaderType> = {
    title: 'IoT 测点',
    desc: '选择设备后查看各测点最新值，点击一行查看该测点的历史数据。'
  };

  ngOnInit(): void {
    this.applyPreset('24h');
    this.deviceService
      .page({ pageIndex: 1, pageSize: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(page => this.devices.set(page?.list ?? []));
    const deviceId = Number(this.route.snapshot.queryParamMap.get('deviceId'));
    if (deviceId) {
      this.onDeviceChange(deviceId);
    }
  }

  onDeviceChange(id: number | null): void {
    this.deviceId.set(id);
    this.identifier.set('');
    this.historyResult.set(null);
    this.latestList.set([]);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { deviceId: id || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    if (!id) {
      this.device.set(null);
      return;
    }
    this.deviceService
      .getDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        if (this.deviceId() !== id) {
          return;
        }
        this.device.set(detail);
        this.devices.update(list => (list.some(item => item.id === detail.id) ? list : [detail, ...list]));
      });
    this.loadLatest();
  }

  onRangeChange(preset: RangePreset): void {
    this.rangePreset.set(preset);
    if (preset !== 'custom') {
      this.applyPreset(preset);
    }
    if (this.identifier()) {
      this.loadHistory();
    }
  }

  selectProperty(row: PropertyLatest): void {
    this.identifier.set(row.identifier);
    this.loadHistory();
  }

  loadHistory(): void {
    const deviceId = this.deviceId();
    const identifier = this.identifier();
    if (!deviceId || !identifier) {
      return;
    }
    const preset = this.rangePreset();
    if (preset !== 'custom') {
      this.applyPreset(preset);
    }
    if (!this.from || !this.to) {
      this.message.warning('请选择时间范围');
      return;
    }
    if (this.from.getTime() > this.to.getTime()) {
      this.message.warning('开始时间不能晚于结束时间');
      return;
    }
    const token = ++this.historyToken;
    this.historyLoading.set(true);
    this.dataService
      .history(deviceId, {
        identifier,
        from: toIsoLocal(this.from),
        to: toIsoLocal(this.to)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          if (token !== this.historyToken) {
            return;
          }
          this.historyResult.set(result);
          this.historyLoading.set(false);
        },
        error: () => {
          if (token === this.historyToken) {
            this.historyLoading.set(false);
          }
        }
      });
  }

  deviceLabel(row: IotDevice): string {
    const nickname = row.nickname?.trim();
    if (nickname && nickname !== row.serialNo) {
      return `${nickname}（${row.serialNo}）`;
    }
    return row.serialNo;
  }

  selectedName(): string {
    const current = this.latestList().find(item => item.identifier === this.identifier());
    return current?.name || this.historyResult()?.name || this.identifier();
  }

  formatValue(value: unknown): string {
    if (value == null || value === '') {
      return '—';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private loadLatest(): void {
    const deviceId = this.deviceId();
    if (!deviceId) {
      return;
    }
    const token = ++this.latestToken;
    this.latestLoading.set(true);
    this.dataService
      .latest(deviceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          if (token !== this.latestToken) {
            return;
          }
          const rows = list ?? [];
          this.latestList.set(rows);
          this.latestLoading.set(false);
          const current = this.identifier();
          const next = rows.some(item => item.identifier === current) ? current : rows[0]?.identifier;
          if (!next) {
            this.identifier.set('');
            this.historyResult.set(null);
            return;
          }
          this.identifier.set(next);
          this.loadHistory();
        },
        error: () => {
          if (token === this.latestToken) {
            this.latestLoading.set(false);
          }
        }
      });
  }

  private applyPreset(preset: Exclude<RangePreset, 'custom'>): void {
    const now = new Date();
    const span = preset === '1h' ? 60 * 60 * 1000 : preset === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    this.to = now;
    this.from = new Date(now.getTime() - span);
  }
}

function toIsoLocal(value: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}
