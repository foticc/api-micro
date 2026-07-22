import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, effect, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { ConsentDTO, ConsentQueryFilter, setToLines } from '@app/pages/system/test/models/oauth2-admin.models';
import { OAuth2ConsentModalService } from '@app/pages/system/test/oauth2-admin/consent/oauth2-consent-modal/oauth2-consent-modal.service';
import { OAuth2ConsentService } from '@app/pages/system/test/oauth2-admin/services/oauth2-consent.service';
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
  imports: [PageHeaderComponent, FormsModule, NzCardModule, NzFormModule, NzGridModule, NzInputModule, NzButtonModule, NzWaveModule, NzIconModule, CardTableWrapComponent, AntTableComponent],
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
  checkedCashArray: ConsentDTO[] = [];

  private requestPageSize = signal(10);
  private requestPageIndex = signal(1);
  private searchFilters = signal<ConsentQueryFilter>({});

  consentResource = this.consentService.pageResource(() => ({
    pageSize: this.requestPageSize(),
    pageIndex: this.requestPageIndex(),
    filters: { ...this.searchFilters() }
  }));

  dataList = computed(() => {
    if (this.consentResource.hasValue()) {
      return [...this.consentResource.value().list];
    }
    return [] as ConsentDTO[];
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
    const isLoading = this.consentResource.isLoading();
    const hasValue = this.consentResource.hasValue();
    this.tableConfig.update(c => ({
      ...c,
      loading: isLoading,
      ...(hasValue
        ? {
            total: this.consentResource.value().total!,
            pageIndex: this.consentResource.value().pageIndex!
          }
        : {})
    }));
  });

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
    this.searchFilters.set({});
    this.requestPageIndex.set(1);
  }

  getDataList(pageIndex: number): void {
    this.searchFilters.set({ ...this.searchParam });
    this.requestPageIndex.set(pageIndex);
  }

  changePageSize(size: number): void {
    this.requestPageSize.set(size);
    this.requestPageIndex.set(1);
  }

  reloadTable(): void {
    this.consentResource.reload();
    this.message.info('刷新成功');
  }

  add(): void {
    this.modalService
      .show({ nzTitle: '新增授权同意', nzWidth: 560 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.consentService
          .create(res.modalValue as ConsentDTO)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.consentResource.reload());
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
            this.consentService
              .update(row.registeredClientId, row.principalName, modalValue as ConsentDTO)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => this.consentResource.reload());
          });
      });
  }

  remove(row: ConsentDTO): void {
    this.modal.confirm({
      nzTitle: '删除授权同意？',
      nzContent: `${row.principalName} @ ${row.registeredClientId}`,
      nzOnOk: () =>
        this.consentService
          .delete([{ registeredClientId: row.registeredClientId, principalName: row.principalName }])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .toPromise()
          .then(() => {
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.requestPageIndex.update(p => Math.max(1, p - 1));
            } else {
              this.consentResource.reload();
            }
          })
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
      nzOnOk: () =>
        this.consentService
          .delete(items)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .toPromise()
          .then(() => {
            this.checkedCashArray = [];
            this.consentResource.reload();
          })
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
      ],
      loading: true
    }));
  }
}
