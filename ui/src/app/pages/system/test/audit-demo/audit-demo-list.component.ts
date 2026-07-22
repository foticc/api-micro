import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { AuditDemoModalService } from '@app/pages/system/test/audit-demo/audit-demo-modal/audit-demo-modal.service';
import { AuditDemoParam, AuditDemoQueryParam, AuditDemoVO } from '@app/pages/system/test/audit-demo/models/audit-demo.models';
import { AuditDemoService } from '@app/pages/system/test/audit-demo/services/audit-demo.service';
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
  selector: 'app-audit-demo-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, FormsModule, NzCardModule, NzFormModule, NzGridModule, NzInputModule, NzButtonModule, NzWaveModule, NzIconModule, CardTableWrapComponent, AntTableComponent],
  templateUrl: './audit-demo-list.component.html'
})
export class AuditDemoListComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly contentTpl = viewChild.required<TemplateRef<NzSafeAny>>('contentTpl');
  readonly createdByTpl = viewChild.required<TemplateRef<NzSafeAny>>('createdByTpl');
  readonly createdAtTpl = viewChild.required<TemplateRef<NzSafeAny>>('createdAtTpl');
  readonly lastModifiedByTpl = viewChild.required<TemplateRef<NzSafeAny>>('lastModifiedByTpl');
  readonly updatedAtTpl = viewChild.required<TemplateRef<NzSafeAny>>('updatedAtTpl');

  private auditDemoService = inject(AuditDemoService);
  private auditDemoModalService = inject(AuditDemoModalService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  searchParam: AuditDemoQueryParam = {};
  checkedCashArray: AuditDemoVO[] = [];

  private requestPageSize = signal(10);
  private requestPageIndex = signal(1);
  private searchFilters = signal<AuditDemoQueryParam>({});

  pageResource = this.auditDemoService.getPageResource(() => ({
    pageSize: this.requestPageSize(),
    pageIndex: this.requestPageIndex(),
    filters: { ...this.searchFilters() }
  }));

  dataList = computed(() => {
    if (this.pageResource.hasValue()) {
      return [...this.pageResource.value().list];
    }
    return [] as AuditDemoVO[];
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

  readonly listPageHeader: Partial<PageHeaderType> = {
    title: '审计演示（测试）',
    desc: '演示 @CreatedDate / @LastModifiedDate / @CreatedBy / @LastModifiedBy 审计字段的 CRUD。'
  };

  ngAfterViewInit(): void {
    this.initTable();
  }

  selectedChecked(rows: AuditDemoVO[]): void {
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
    this.pageResource.reload();
    this.message.info('刷新成功');
  }

  add(): void {
    this.auditDemoModalService
      .show({ nzTitle: '新增审计演示' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.auditDemoService
          .create(res.modalValue as AuditDemoParam)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.requestPageIndex.set(1);
              this.pageResource.reload();
            },
            error: err => this.showError(err)
          });
      });
  }

  edit(id: number): void {
    this.auditDemoService
      .getDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(detail => {
        if (!detail) {
          return;
        }
        this.auditDemoModalService
          .show({ nzTitle: '编辑审计演示' }, detail)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            const { title, content } = modalValue as AuditDemoParam;
            this.auditDemoService
              .update(id, { title, content })
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => this.pageResource.reload(),
                error: err => this.showError(err)
              });
          });
      });
  }

  allDel(): void {
    if (this.checkedCashArray.length === 0) {
      this.message.warning('请勾选要删除的记录');
      return;
    }
    const ids = this.checkedCashArray.map(row => row.id!).filter(id => id != null);
    this.modal.confirm({
      nzTitle: '确定要批量删除吗？',
      nzContent: `将删除 ${ids.length} 条记录，删除后不可恢复`,
      nzOnOk: () =>
        this.auditDemoService
          .delete(ids)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.checkedCashArray = [];
            this.pageResource.reload();
          })
    });
  }

  remove(id: number, row: AuditDemoVO): void {
    this.modal.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: `删除「${row.title}」，删除后不可恢复`,
      nzOnOk: () =>
        this.auditDemoService
          .delete([id])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.requestPageIndex.update(p => Math.max(1, p - 1));
            } else {
              this.pageResource.reload();
            }
          })
    });
  }

  private buildFilters(): AuditDemoQueryParam {
    const filters: AuditDemoQueryParam = {};
    const kw = this.searchParam.keyword?.trim();
    if (kw) {
      filters.keyword = kw;
    }
    return filters;
  }

  private initTable(): void {
    this.tableConfig.set({
      showCheckbox: true,
      headers: [
        { title: '标题', field: 'title', width: 160 },
        { title: '内容', field: 'content', tdTemplate: this.contentTpl() },
        { title: '创建人', field: 'createdBy', width: 100, tdTemplate: this.createdByTpl(), notNeedEllipsis: true },
        { title: '创建时间', field: 'createdAt', width: 170, tdTemplate: this.createdAtTpl() },
        { title: '更新人', field: 'lastModifiedBy', width: 100, tdTemplate: this.lastModifiedByTpl(), notNeedEllipsis: true },
        { title: '更新时间', field: 'updatedAt', width: 170, tdTemplate: this.updatedAtTpl() },
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
