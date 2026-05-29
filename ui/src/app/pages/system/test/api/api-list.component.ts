import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiResourceDTO, ApiResourceSearchParam, ApiResourceService } from '@services/system/api-resource.service';
import { SearchCommonVO } from '@core/services/types';
import { AntTableConfig, AntTableComponent } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { ModalBtnStatus } from '@widget/base-modal';
import { ApiModalService } from '@widget/biz-widget/system/api-modal/api-modal.service';
import { ApiSyncService } from './api-sync.service';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-api-list',
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
  templateUrl: './api-list.component.html'
})
export class ApiListComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly methodTagTpl = viewChild.required<TemplateRef<NzSafeAny>>('methodTagTpl');
  readonly descriptionTpl = viewChild.required<TemplateRef<NzSafeAny>>('descriptionTpl');

  private apiService = inject(ApiResourceService);
  private apiSyncService = inject(ApiSyncService);
  private apiModalService = inject(ApiModalService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  searchParam: ApiResourceSearchParam = {};
  tableConfig = signal<AntTableConfig>({
    headers: [],
    total: 0,
    showCheckbox: false,
    loading: false,
    pageSize: 10,
    pageIndex: 1
  });
  dataList = signal<ApiResourceDTO[]>([]);
  checkedCashArray: ApiResourceDTO[] = [];

  readonly listPageHeader: Partial<PageHeaderType> = {
    title: 'API 资源管理（测试）',
    desc: '维护后端接口资源（方法 + 路径），供权限资源组引用与授权。'
  };

  readonly methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' }
  ];

  ngAfterViewInit(): void {
    this.initTable();
  }

  selectedChecked(rows: ApiResourceDTO[]): void {
    this.checkedCashArray = [...rows];
  }

  getDataList(e?: NzTableQueryParams | { pageIndex: number }): void {
    this.tableLoading(true);
    const filters: ApiResourceSearchParam = {};
    const kw = this.searchParam.keyword?.trim();
    if (kw) {
      filters.keyword = kw;
    }
    if (this.searchParam.method) {
      filters.method = this.searchParam.method;
    }
    const params: SearchCommonVO<ApiResourceSearchParam> = {
      pageSize: this.tableConfig().pageSize!,
      pageIndex: e?.pageIndex ?? this.tableConfig().pageIndex!,
      filters
    };

    this.apiService
      .getApiResourcePage(params)
      .pipe(
        finalize(() => this.tableLoading(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.dataList.set([...data.list]);
        this.tableConfig.update(c => ({
          ...c,
          total: data.total,
          pageIndex: data.pageIndex,
          pageSize: data.pageSize
        }));
        this.checkedCashArray = [...this.checkedCashArray];
      });
  }

  resetSearch(): void {
    this.searchParam = {};
    this.getDataList({ pageIndex: 1 });
  }

  changePageSize(size: number): void {
    this.tableConfig.update(c => ({ ...c, pageSize: size }));
  }

  reloadTable(): void {
    this.message.info('刷新成功');
    this.getDataList();
  }

  openSync(): void {
    this.modal.confirm({
      nzTitle: '同步接口资源库',
      nzContent: '将根据后台扫描结果，将尚未登记的 API 自动写入资源库。是否继续？',
      nzOkText: '开始同步',
      nzOnOk: () => {
        this.tableLoading(true);
        return this.apiSyncService
          .runSync()
          .pipe(
            finalize(() => this.tableLoading(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(result => {
            if (result.created > 0) {
              this.message.success(`已同步 ${result.created} 条 API`);
              this.getDataList({ pageIndex: 1 });
            } else {
              this.message.info('无需同步，资源库已与后台一致');
            }
          });
      }
    });
  }

  add(): void {
    this.apiModalService
      .show({ nzTitle: '新增 API' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.tableLoading(true);
        this.apiService
          .addApiResource(res.modalValue as ApiResourceDTO)
          .pipe(
            finalize(() => this.tableLoading(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe({
            next: () => this.getDataList({ pageIndex: 1 }),
            error: err => this.showError(err)
          });
      });
  }

  edit(id: number): void {
    this.apiService
      .getApiResourceDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        if (!detail) {
          return;
        }
        this.apiModalService
          .show({ nzTitle: '编辑 API' }, detail)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            this.tableLoading(true);
            this.apiService
              .editApiResource({ ...(modalValue as ApiResourceDTO), id })
              .pipe(
                finalize(() => this.tableLoading(false)),
                takeUntilDestroyed(this.destroyRef)
              )
              .subscribe({
                next: () => this.getDataList(),
                error: err => this.showError(err)
              });
          });
      });
  }

  allDel(): void {
    if (this.checkedCashArray.length === 0) {
      this.message.warning('请勾选要删除的 API');
      return;
    }
    const ids = this.checkedCashArray.map(row => row.id!).filter(id => id != null);
    this.modal.confirm({
      nzTitle: '确定要批量删除吗？',
      nzContent: `将删除 ${ids.length} 条 API，删除后不可恢复`,
      nzOnOk: () => {
        this.tableLoading(true);
        return this.apiService
          .delApiResource(ids)
          .pipe(
            finalize(() => this.tableLoading(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            if (this.dataList().length === ids.length && this.tableConfig().pageIndex !== 1) {
              this.tableConfig.update(c => ({ ...c, pageIndex: c.pageIndex! - 1 }));
            } else {
              this.getDataList();
            }
            this.checkedCashArray = [];
          });
      }
    });
  }

  remove(id: number, row: ApiResourceDTO): void {
    this.modal.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: `删除 ${row.method} ${row.path}，删除后不可恢复`,
      nzOnOk: () => {
        this.tableLoading(true);
        return this.apiService
          .delApiResource([id])
          .pipe(
            finalize(() => this.tableLoading(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.tableConfig.update(c => ({ ...c, pageIndex: c.pageIndex! - 1 }));
            } else {
              this.getDataList();
            }
          });
      }
    });
  }

  private initTable(): void {
    this.tableConfig.set({
      showCheckbox: true,
      headers: [
        {
          title: '请求方法',
          field: 'method',
          width: 100,
          tdTemplate: this.methodTagTpl(),
          notNeedEllipsis: true
        },
        {
          title: 'API 路径',
          field: 'path',
          width: 280
        },
        {
          title: '描述',
          field: 'description',
          tdTemplate: this.descriptionTpl()
        },
        {
          title: '操作',
          tdTemplate: this.operationTpl(),
          width: 140,
          fixed: true,
          fixedDir: 'right'
        }
      ],
      total: 0,
      loading: true,
      pageSize: 10,
      pageIndex: 1
    });
  }

  private tableLoading(loading: boolean): void {
    this.tableConfig.update(c => ({ ...c, loading }));
  }

  private showError(err: NzSafeAny): void {
    const msg = err?.error?.msg || err?.message;
    if (msg) {
      this.message.warning(msg);
    }
  }
}
