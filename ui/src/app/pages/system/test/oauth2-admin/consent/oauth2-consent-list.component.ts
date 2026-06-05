import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ConsentDTO, ConsentQueryFilter, setToLines } from '@app/pages/system/test/models/oauth2-admin.models';
import { OAuth2ConsentModalService } from '@app/pages/system/test/oauth2-admin/consent/oauth2-consent-modal/oauth2-consent-modal.service';
import { OAuth2ConsentService } from '@app/pages/system/test/oauth2-admin/services/oauth2-consent.service';
import { SearchCommonVO } from '@core/services/types';
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

@Component({
  selector: 'app-oauth2-consent-list',
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
    CardTableWrapComponent,
    AntTableComponent
  ],
  templateUrl: './oauth2-consent-list.component.html'
})
export class OAuth2ConsentListComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly authoritiesTpl = viewChild.required<TemplateRef<NzSafeAny>>('authoritiesTpl');

  private consentService = inject(OAuth2ConsentService);
  private modalService = inject(OAuth2ConsentModalService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  searchParam: ConsentQueryFilter = {};
  tableConfig = signal<AntTableConfig>({
    headers: [],
    total: 0,
    showCheckbox: true,
    loading: false,
    pageSize: 10,
    pageIndex: 1
  });
  dataList = signal<ConsentDTO[]>([]);
  checkedCashArray: ConsentDTO[] = [];

  readonly pageHeader: Partial<PageHeaderType> = {
    title: 'OAuth2 授权同意（AuthorizationConsent）',
    desc: '管理用户对客户端的 scope 授权同意记录，对应 api-auth `/oauth2/consent` 接口。'
  };

  ngAfterViewInit(): void {
    this.initTable();
  }

  selectedChecked(rows: ConsentDTO[]): void {
    this.checkedCashArray = [...rows];
  }

  resetSearch(): void {
    this.searchParam = {};
    this.getDataList({ pageIndex: 1 });
  }

  getDataList(e?: { pageIndex: number }): void {
    this.tableLoading(true);
    const params: SearchCommonVO<ConsentQueryFilter> = {
      pageSize: this.tableConfig().pageSize!,
      pageIndex: e?.pageIndex ?? this.tableConfig().pageIndex!,
      filters: { ...this.searchParam }
    };
    this.consentService
      .page(params)
      .pipe(
        finalize(() => this.tableLoading(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.dataList.set([...data.list]);
        this.tableConfig.update(c => ({ ...c, total: data.total, pageIndex: data.pageIndex }));
      });
  }

  changePageSize(size: number): void {
    this.tableConfig.update(c => ({ ...c, pageSize: size, pageIndex: 1 }));
    this.getDataList({ pageIndex: 1 });
  }

  reloadTable(): void {
    this.message.info('刷新成功');
    this.getDataList();
  }

  add(): void {
    this.modalService
      .show({ nzTitle: '新增授权同意', nzWidth: 560 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.tableLoading(true);
        this.consentService
          .create(res.modalValue as ConsentDTO)
          .pipe(finalize(() => this.tableLoading(false)))
          .subscribe(() => this.getDataList());
      });
  }

  edit(row: ConsentDTO): void {
    this.consentService
      .get(row.registeredClientId, row.principalName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        this.modalService
          .show({ nzTitle: '编辑授权同意', nzWidth: 560 }, detail)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            this.tableLoading(true);
            this.consentService
              .update(row.registeredClientId, row.principalName, modalValue as ConsentDTO)
              .pipe(finalize(() => this.tableLoading(false)))
              .subscribe(() => this.getDataList());
          });
      });
  }

  remove(row: ConsentDTO): void {
    this.modal.confirm({
      nzTitle: '删除授权同意？',
      nzContent: `${row.principalName} @ ${row.registeredClientId}`,
      nzOnOk: () => {
        this.tableLoading(true);
        return this.consentService
          .delete([{ registeredClientId: row.registeredClientId, principalName: row.principalName }])
          .pipe(finalize(() => this.tableLoading(false)))
          .toPromise()
          .then(() => this.getDataList());
      }
    });
  }

  allDel(): void {
    if (!this.checkedCashArray.length) {
      this.message.error('请勾选数据');
      return;
    }
    const items = this.checkedCashArray.map(r => ({
      registeredClientId: r.registeredClientId,
      principalName: r.principalName
    }));
    this.modal.confirm({
      nzTitle: '批量删除？',
      nzContent: `已选 ${items.length} 条`,
      nzOnOk: () => {
        this.tableLoading(true);
        return this.consentService
          .delete(items)
          .pipe(finalize(() => this.tableLoading(false)))
          .toPromise()
          .then(() => this.getDataList());
      }
    });
  }

  authoritiesText(row: ConsentDTO): string {
    return setToLines(row.authorities) || '—';
  }

  private initTable(): void {
    this.tableConfig.update(config => ({
      ...config,
      headers: [
        { title: 'Client ID', field: 'registeredClientId', width: 200 },
        { title: '用户', field: 'principalName', width: 140 },
        { title: 'Authorities', tdTemplate: this.authoritiesTpl(), width: 240 },
        { title: '操作', tdTemplate: this.operationTpl(), width: 120, fixed: true, fixedDir: 'right' }
      ]
    }));
    this.getDataList();
  }

  private tableLoading(loading: boolean): void {
    this.tableConfig.update(c => ({ ...c, loading }));
  }
}
