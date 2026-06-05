import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {
  RegisteredClientDTO,
  RegisteredClientQueryFilter,
  setToLines
} from '@app/pages/system/test/models/oauth2-admin.models';
import { OAuth2ClientModalService } from '@app/pages/system/test/oauth2-admin/client/oauth2-client-modal/oauth2-client-modal.service';
import { OAuth2ClientService } from '@app/pages/system/test/oauth2-admin/services/oauth2-client.service';
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
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-oauth2-client-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    PageHeaderComponent,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    NzTagModule,
    CardTableWrapComponent,
    AntTableComponent
  ],
  templateUrl: './oauth2-client-list.component.html'
})
export class OAuth2ClientListComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly scopesTpl = viewChild.required<TemplateRef<NzSafeAny>>('scopesTpl');
  readonly pkceTpl = viewChild.required<TemplateRef<NzSafeAny>>('pkceTpl');
  readonly issuedAtTpl = viewChild.required<TemplateRef<NzSafeAny>>('issuedAtTpl');

  private clientService = inject(OAuth2ClientService);
  private modalService = inject(OAuth2ClientModalService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  searchParam: RegisteredClientQueryFilter = {};
  tableConfig = signal<AntTableConfig>({
    headers: [],
    total: 0,
    showCheckbox: true,
    loading: false,
    pageSize: 10,
    pageIndex: 1
  });
  dataList = signal<RegisteredClientDTO[]>([]);
  checkedCashArray: RegisteredClientDTO[] = [];

  readonly pageHeader: Partial<PageHeaderType> = {
    title: 'OAuth2 客户端（RegisteredClient）',
    desc: '管理授权服务器注册的 OAuth2 客户端，对应 api-auth `/oauth2/client` 接口。'
  };

  ngAfterViewInit(): void {
    this.initTable();
  }

  selectedChecked(rows: RegisteredClientDTO[]): void {
    this.checkedCashArray = [...rows];
  }

  resetSearch(): void {
    this.searchParam = {};
    this.getDataList({ pageIndex: 1 });
  }

  getDataList(e?: { pageIndex: number }): void {
    this.tableLoading(true);
    const params: SearchCommonVO<RegisteredClientQueryFilter> = {
      pageSize: this.tableConfig().pageSize!,
      pageIndex: e?.pageIndex ?? this.tableConfig().pageIndex!,
      filters: { ...this.searchParam }
    };
    this.clientService
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
      .show({ nzTitle: '新增 OAuth2 客户端', nzWidth: 800, nzBodyStyle: { maxHeight: '75vh', overflow: 'auto', padding: '16px 24px' } })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.tableLoading(true);
        this.clientService
          .create(res.modalValue as RegisteredClientDTO)
          .pipe(finalize(() => this.tableLoading(false)))
          .subscribe(() => this.getDataList());
      });
  }

  edit(id: string): void {
    this.clientService
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        this.modalService
          .show({ nzTitle: '编辑 OAuth2 客户端', nzWidth: 800, nzBodyStyle: { maxHeight: '75vh', overflow: 'auto', padding: '16px 24px' } }, detail)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            this.tableLoading(true);
            this.clientService
              .update(id, modalValue as RegisteredClientDTO)
              .pipe(finalize(() => this.tableLoading(false)))
              .subscribe(() => this.getDataList());
          });
      });
  }

  remove(id: string, row: RegisteredClientDTO): void {
    this.modal.confirm({
      nzTitle: '确定删除该客户端？',
      nzContent: `Client ID：${row.clientId}`,
      nzOnOk: () => {
        this.tableLoading(true);
        return this.clientService
          .delete([id])
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
    const ids = this.checkedCashArray.map(r => r.id!).filter(Boolean);
    this.modal.confirm({
      nzTitle: '确定批量删除？',
      nzContent: `已选 ${ids.length} 条`,
      nzOnOk: () => {
        this.tableLoading(true);
        return this.clientService
          .delete(ids)
          .pipe(finalize(() => this.tableLoading(false)))
          .toPromise()
          .then(() => this.getDataList());
      }
    });
  }

  scopesText(row: RegisteredClientDTO): string {
    return setToLines(row.scopes) || '—';
  }

  private initTable(): void {
    this.tableConfig.update(config => ({
      ...config,
      headers: [
        { title: 'Client ID', field: 'clientId', width: 160 },
        { title: '名称', field: 'clientName', width: 140 },
        { title: 'Scopes', tdTemplate: this.scopesTpl(), width: 180 },
        { title: 'PKCE', tdTemplate: this.pkceTpl(), width: 80 },
        { title: '注册时间', tdTemplate: this.issuedAtTpl(), width: 170 },
        { title: '操作', tdTemplate: this.operationTpl(), width: 120, fixed: true, fixedDir: 'right' }
      ]
    }));
    this.getDataList();
  }

  private tableLoading(loading: boolean): void {
    this.tableConfig.update(c => ({ ...c, loading }));
  }
}
