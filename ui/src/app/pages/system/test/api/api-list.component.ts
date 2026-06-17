import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, effect, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiResourceDTO, ApiResourceSearchParam, ApiResourceService } from '@services/system/api-resource.service';
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
  checkedCashArray: ApiResourceDTO[] = [];

  private requestPageSize = signal(10);
  private requestPageIndex = signal(1);
  private searchFilters = signal<ApiResourceSearchParam>({});

  apiResource = this.apiService.getApiResourcePageResource(() => ({
    pageSize: this.requestPageSize(),
    pageIndex: this.requestPageIndex(),
    filters: { ...this.searchFilters() }
  }));

  dataList = computed(() => {
    if (this.apiResource.hasValue()) {
      return [...this.apiResource.value().list];
    }
    return [] as ApiResourceDTO[];
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
    const isLoading = this.apiResource.isLoading();
    const hasValue = this.apiResource.hasValue();
    this.tableConfig.update(c => ({
      ...c,
      loading: isLoading,
      ...(hasValue
        ? {
            total: this.apiResource.value().total!,
            pageIndex: this.apiResource.value().pageIndex!,
            pageSize: this.apiResource.value().pageSize!
          }
        : {})
    }));
  });

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

  getDataList(pageIndex: number): void {
    this.searchFilters.set(this.buildFilters());
    this.requestPageIndex.set(pageIndex);
  }

  resetSearch(): void {
    this.searchParam = {};
    this.searchFilters.set({});
    this.requestPageIndex.set(1);
  }

  changePageSize(size: number): void {
    this.requestPageSize.set(size);
    this.requestPageIndex.set(1);
  }

  reloadTable(): void {
    this.apiResource.reload();
    this.message.info('刷新成功');
  }

  openSync(): void {
    this.modal.confirm({
      nzTitle: '同步接口资源库',
      nzContent: '将根据后台扫描结果，将尚未登记的 API 自动写入资源库。是否继续？',
      nzOkText: '开始同步',
      nzOnOk: () =>
        this.apiSyncService
          .runSync()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(result => {
            if (result.created > 0) {
              this.message.success(`已同步 ${result.created} 条 API`);
              this.requestPageIndex.set(1);
              this.apiResource.reload();
            } else {
              this.message.info('无需同步，资源库已与后台一致');
            }
          })
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
        this.apiService
          .addApiResource(res.modalValue as ApiResourceDTO)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.requestPageIndex.set(1);
              this.apiResource.reload();
            },
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
            const { method, path, description } = modalValue as ApiResourceDTO;
            this.apiService
              .editApiResource(id, { method, path, description })
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => this.apiResource.reload(),
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
      nzOnOk: () =>
        this.apiService
          .delApiResource(ids)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.checkedCashArray = [];
            this.apiResource.reload();
          })
    });
  }

  remove(id: number, row: ApiResourceDTO): void {
    this.modal.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: `删除 ${row.method} ${row.path}，删除后不可恢复`,
      nzOnOk: () =>
        this.apiService
          .delApiResource([id])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.requestPageIndex.update(p => Math.max(1, p - 1));
            } else {
              this.apiResource.reload();
            }
          })
    });
  }

  private buildFilters(): ApiResourceSearchParam {
    const filters: ApiResourceSearchParam = {};
    const kw = this.searchParam.keyword?.trim();
    if (kw) {
      filters.keyword = kw;
    }
    if (this.searchParam.method) {
      filters.method = this.searchParam.method;
    }
    return filters;
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

  private showError(err: NzSafeAny): void {
    const msg = err?.error?.msg || err?.message;
    if (msg) {
      this.message.warning(msg);
    }
  }
}
