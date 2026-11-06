import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal, computed, effect, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiResourceDTO, ApiResourceModuleStat, ApiResourceSearchParam, ApiResourceService } from '@services/system/api-resource.service';
import { AntTableConfig, AntTableComponent } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { ModalBtnStatus } from '@widget/base-modal';
import { ApiModalService } from '@widget/biz-widget/system/api-modal/api-modal.service';

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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { ApiSyncService } from './api-sync.service';

const FALLBACK_MODULE = '其他';

type CatalogSelection = { kind: 'all' } | { kind: 'stale' } | { kind: 'module'; module: string };

@Component({
  selector: 'app-api-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    FormsModule,
    RouterLink,
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
  templateUrl: './api-list.component.html',
  styleUrl: './api-list.component.less'
})
export class ApiListComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly methodTagTpl = viewChild.required<TemplateRef<NzSafeAny>>('methodTagTpl');
  readonly descriptionTpl = viewChild.required<TemplateRef<NzSafeAny>>('descriptionTpl');
  readonly sourceTpl = viewChild.required<TemplateRef<NzSafeAny>>('sourceTpl');
  readonly permissionTpl = viewChild.required<TemplateRef<NzSafeAny>>('permissionTpl');

  private apiService = inject(ApiResourceService);
  private apiSyncService = inject(ApiSyncService);
  private apiModalService = inject(ApiModalService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  searchParam: ApiResourceSearchParam = {};
  statusFilter: string | null = null;
  checkedCashArray: ApiResourceDTO[] = [];

  private requestPageSize = signal(10);
  private requestPageIndex = signal(1);
  private searchFilters = signal<ApiResourceSearchParam>({});
  private catalogVersion = signal(0);
  readonly selection = signal<CatalogSelection>({ kind: 'all' });

  apiResource = this.apiService.getApiResourcePageResource(() => ({
    pageSize: this.requestPageSize(),
    pageIndex: this.requestPageIndex(),
    filters: { ...this.searchFilters() }
  }));

  modulesResource = this.apiService.getModulesResource(() => {
    this.catalogVersion();
    return {};
  });

  dataList = computed(() => {
    if (this.apiResource.hasValue()) {
      return [...this.apiResource.value().list];
    }
    return [] as ApiResourceDTO[];
  });

  moduleStats = computed(() => {
    if (!this.modulesResource.hasValue()) {
      return [] as ApiResourceModuleStat[];
    }
    return this.modulesResource.value().modules.filter(item => item.module !== FALLBACK_MODULE);
  });

  otherCount = computed(() => {
    if (!this.modulesResource.hasValue()) {
      return 0;
    }
    return this.modulesResource.value().modules.find(item => item.module === FALLBACK_MODULE)?.count ?? 0;
  });

  totalCount = computed(() => (this.modulesResource.hasValue() ? this.modulesResource.value().total : 0));

  staleCount = computed(() => (this.modulesResource.hasValue() ? this.modulesResource.value().staleCount : 0));

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
    desc: '按路径模块浏览接口。扫描记录只改描述；授权仍在权限资源组维护。'
  };

  readonly methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' }
  ];

  readonly statusOptions = [
    { label: '未绑定权限', value: 'unbound' },
    { label: '没有描述', value: 'missingDescription' },
    { label: '已失效', value: 'stale' }
  ];

  ngAfterViewInit(): void {
    this.initTable();
  }

  selectedChecked(rows: ApiResourceDTO[]): void {
    this.checkedCashArray = [...rows];
  }

  selectAll(): void {
    this.selection.set({ kind: 'all' });
    this.getDataList(1);
  }

  selectStale(): void {
    this.selection.set({ kind: 'stale' });
    this.getDataList(1);
  }

  selectModule(module: string): void {
    this.selection.set({ kind: 'module', module });
    this.getDataList(1);
  }

  isModuleSelected(module: string): boolean {
    const current = this.selection();
    return current.kind === 'module' && current.module === module;
  }

  getDataList(pageIndex: number): void {
    this.searchFilters.set(this.buildFilters());
    this.requestPageIndex.set(pageIndex);
  }

  resetSearch(): void {
    this.searchParam = {};
    this.statusFilter = null;
    this.getDataList(1);
  }

  changePageSize(size: number): void {
    this.requestPageSize.set(size);
    this.requestPageIndex.set(1);
  }

  reloadTable(): void {
    this.catalogVersion.update(version => version + 1);
    this.apiResource.reload();
    this.message.info('刷新成功');
  }

  openSync(): void {
    this.modal.confirm({
      nzTitle: '同步接口资源库',
      nzContent: '将扫描当前服务已注册的接口，把尚未入库的写入资源库，并刷新已有记录的模块与名称。',
      nzOkText: '开始同步',
      nzOnOk: () =>
        firstValueFrom(
          this.apiSyncService.runSync().pipe(
            tap(result => {
              this.message.success(`新增 ${result.created}，刷新 ${result.refreshed}，失效 ${result.stale}`);
              this.catalogVersion.update(version => version + 1);
              this.requestPageIndex.set(1);
              this.apiResource.reload();
            })
          )
        )
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
              this.catalogVersion.update(version => version + 1);
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
            const payload = detail.source === 'SCAN' ? { method: detail.method, path: detail.path, description } : { method, path, description };
            this.apiService
              .editApiResource(id, payload)
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
    const referenced = this.referenceText(this.checkedCashArray);
    this.modal.confirm({
      nzTitle: '确定要批量删除吗？',
      nzContent: `${referenced}将删除 ${ids.length} 条 API，删除后不可恢复`,
      nzOnOk: () =>
        this.apiService
          .delApiResource(ids)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.checkedCashArray = [];
            this.catalogVersion.update(version => version + 1);
            this.apiResource.reload();
          })
    });
  }

  remove(id: number, row: ApiResourceDTO): void {
    const referenced = this.referenceText([row]);
    this.modal.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: `${referenced}删除 ${row.method} ${row.path}，删除后不可恢复`,
      nzOnOk: () =>
        this.apiService
          .delApiResource([id])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.catalogVersion.update(version => version + 1);
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.requestPageIndex.update(page => Math.max(1, page - 1));
            } else {
              this.apiResource.reload();
            }
          })
    });
  }

  private referenceText(rows: ApiResourceDTO[]): string {
    const names = [...new Set(rows.flatMap(row => row.permissions ?? []).map(item => item.name).filter(Boolean))];
    if (names.length === 0) {
      return '';
    }
    return `已被权限引用：${names.join('、')}。`;
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
    const current = this.selection();
    if (current.kind === 'module') {
      filters.module = current.module;
    }
    if (current.kind === 'stale' || this.statusFilter === 'stale') {
      filters.status = 'STALE';
    }
    if (this.statusFilter === 'unbound') {
      filters.unbound = true;
    }
    if (this.statusFilter === 'missingDescription') {
      filters.missingDescription = true;
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
          width: 240
        },
        {
          title: '名称',
          field: 'name',
          width: 140
        },
        {
          title: '描述',
          field: 'description',
          tdTemplate: this.descriptionTpl()
        },
        {
          title: '来源',
          field: 'source',
          width: 130,
          tdTemplate: this.sourceTpl(),
          notNeedEllipsis: true
        },
        {
          title: '引用权限',
          field: 'permissions',
          width: 180,
          tdTemplate: this.permissionTpl(),
          notNeedEllipsis: true
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
