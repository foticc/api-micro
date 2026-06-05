import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AuthorizationDTO, AuthorizationQueryFilter, setToLines } from '@app/pages/system/test/models/oauth2-admin.models';
import { OAuth2AuthorizationDetailComponent } from '@app/pages/system/test/oauth2-admin/authorization/oauth2-authorization-detail/oauth2-authorization-detail.component';
import { OAuth2AuthorizationService } from '@app/pages/system/test/oauth2-admin/services/oauth2-authorization.service';
import { SearchCommonVO } from '@core/services/types';
import { AntTableComponent, AntTableConfig } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';

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
  selector: 'app-oauth2-authorization-list',
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
    NzTagModule,
    CardTableWrapComponent,
    AntTableComponent
  ],
  templateUrl: './oauth2-authorization-list.component.html'
})
export class OAuth2AuthorizationListComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly scopesTpl = viewChild.required<TemplateRef<NzSafeAny>>('scopesTpl');
  readonly tokenTpl = viewChild.required<TemplateRef<NzSafeAny>>('tokenTpl');

  private authService = inject(OAuth2AuthorizationService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  searchParam: AuthorizationQueryFilter = {};
  tableConfig = signal<AntTableConfig>({
    headers: [],
    total: 0,
    showCheckbox: true,
    loading: false,
    pageSize: 10,
    pageIndex: 1
  });
  dataList = signal<AuthorizationDTO[]>([]);
  checkedCashArray: AuthorizationDTO[] = [];

  readonly pageHeader: Partial<PageHeaderType> = {
    title: 'OAuth2 授权记录（Authorization）',
    desc: '查看、撤销或删除授权服务器中的 OAuth2Authorization 记录（只读产生，不可新建）。'
  };

  ngAfterViewInit(): void {
    this.initTable();
  }

  selectedChecked(rows: AuthorizationDTO[]): void {
    this.checkedCashArray = [...rows];
  }

  resetSearch(): void {
    this.searchParam = {};
    this.getDataList({ pageIndex: 1 });
  }

  getDataList(e?: { pageIndex: number }): void {
    this.tableLoading(true);
    const params: SearchCommonVO<AuthorizationQueryFilter> = {
      pageSize: this.tableConfig().pageSize!,
      pageIndex: e?.pageIndex ?? this.tableConfig().pageIndex!,
      filters: { ...this.searchParam }
    };
    this.authService
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

  viewDetail(id: string): void {
    this.authService
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        this.modal.create({
          nzTitle: '授权详情',
          nzWidth: 780,
          nzFooter: null,
          nzContent: OAuth2AuthorizationDetailComponent,
          nzData: { detail },
          nzBodyStyle: { maxHeight: '70vh', overflow: 'auto', padding: '16px 24px' }
        });
      });
  }

  revoke(id: string, row: AuthorizationDTO): void {
    this.modal.confirm({
      nzTitle: '撤销授权？',
      nzContent: `用户 ${row.principalName ?? '—'} 的授权将被移除`,
      nzOnOk: () => {
        this.tableLoading(true);
        return this.authService
          .revoke(id)
          .pipe(finalize(() => this.tableLoading(false)))
          .toPromise()
          .then(() => this.getDataList());
      }
    });
  }

  remove(id: string): void {
    this.modal.confirm({
      nzTitle: '删除授权记录？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.tableLoading(true);
        return this.authService
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
      nzTitle: '批量删除授权记录？',
      nzContent: `已选 ${ids.length} 条`,
      nzOnOk: () => {
        this.tableLoading(true);
        return this.authService
          .delete(ids)
          .pipe(finalize(() => this.tableLoading(false)))
          .toPromise()
          .then(() => this.getDataList());
      }
    });
  }

  scopesText(row: AuthorizationDTO): string {
    return setToLines(row.authorizedScopes) || '—';
  }

  tokenHint(row: AuthorizationDTO): string {
    const t = row.accessToken?.tokenValue ?? row.authorizationCode?.tokenValue;
    return t ? '********' : '—';
  }

  private initTable(): void {
    this.tableConfig.update(config => ({
      ...config,
      headers: [
        { title: '用户', field: 'principalName', width: 120 },
        { title: 'Client ID', field: 'registeredClientId', width: 160 },
        { title: 'Grant Type', field: 'authorizationGrantType', width: 160 },
        { title: 'Scopes', tdTemplate: this.scopesTpl(), width: 160 },
        { title: 'Token', tdTemplate: this.tokenTpl(), width: 140 },
        { title: '操作', tdTemplate: this.operationTpl(), width: 160, fixed: true, fixedDir: 'right' }
      ]
    }));
    this.getDataList();
  }

  private tableLoading(loading: boolean): void {
    this.tableConfig.update(c => ({ ...c, loading }));
  }
}
