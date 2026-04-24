import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { SearchCommonVO } from '@core/services/types';
import { DictItem, DictService } from '@services/system/dict.service';
import { AntTableConfig, AntTableComponent } from '@shared/components/ant-table/ant-table.component';
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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableQueryParams } from 'ng-zorro-antd/table';

@Component({
  selector: 'app-dict-manage',
  templateUrl: './dict-manage.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    CardTableWrapComponent,
    AntTableComponent,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule
  ]
})
export class DictManageComponent implements OnInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly pageHeaderInfo: Partial<PageHeaderType> = {
    title: '字典管理',
    breadcrumb: ['首页', '系统管理', '字典管理']
  };

  readonly tableConfig = signal<AntTableConfig>({
    headers: [],
    total: 0,
    showCheckbox: false,
    loading: false,
    pageSize: 10,
    pageIndex: 1
  });
  readonly dataList = signal<DictItem[]>([]);
  readonly keyword = signal('');
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly dictForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(64)]],
    name: ['', [Validators.required, Validators.maxLength(64)]]
  });

  isModalVisible = false;
  isEditing = false;
  editingId: number | null = null;

  constructor(
    private readonly dictService: DictService,
    private readonly message: NzMessageService,
    private readonly modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.initTable();
    this.getDataList({ pageIndex: 1 });
  }

  resetForm(): void {
    this.keyword.set('');
    this.getDataList({ pageIndex: 1 });
  }

  tableLoading(isLoading: boolean): void {
    this.tableConfig.update(config => ({ ...config, loading: isLoading }));
  }

  reloadTable(): void {
    this.message.info('刷新成功');
    this.getDataList();
  }

  changePageSize(pageSize: number): void {
    this.tableConfig.update(config => ({ ...config, pageSize }));
    this.getDataList({ pageIndex: 1 });
  }

  getDataList(e?: { pageIndex: number } | NzTableQueryParams): void {
    this.tableLoading(true);
    const params: SearchCommonVO<{ keyword: string }> = {
      pageIndex: e?.pageIndex || this.tableConfig().pageIndex,
      pageSize: this.tableConfig().pageSize,
      filters: {
        keyword: this.keyword().trim()
      }
    };

    this.dictService
      .getDictList(params)
      .pipe(
        finalize(() => {
          this.tableLoading(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        const { list, total, pageIndex } = data;
        this.dataList.set([...list]);
        this.tableConfig.update(config => ({ ...config, total, pageIndex }));
      });
  }

  add(): void {
    this.isEditing = false;
    this.editingId = null;
    this.dictForm.reset({ code: '', name: '' });
    this.isModalVisible = true;
  }

  edit(dataItem: DictItem): void {
    this.tableLoading(true);
    this.dictService
      .getDictDetail(dataItem.id!)
      .pipe(
        finalize(() => {
          this.tableLoading(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(detail => {
        this.isEditing = true;
        this.editingId = detail.id ?? null;
        this.dictForm.reset({
          code: detail.code,
          name: detail.name
        });
        this.isModalVisible = true;
      });
  }

  del(id: number): void {
    this.modal.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.tableLoading(true);
        this.dictService
          .delDict([id])
          .pipe(
            finalize(() => {
              this.tableLoading(false);
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.getDataList({ pageIndex: this.tableConfig().pageIndex - 1 });
            } else {
              this.getDataList();
            }
          });
      }
    });
  }

  handleModalCancel(): void {
    this.isModalVisible = false;
  }

  handleModalOk(): void {
    if (this.dictForm.invalid) {
      this.dictForm.markAllAsTouched();
      return;
    }

    const value = this.dictForm.getRawValue();
    const code = value.code.trim();
    const name = value.name.trim();

    this.tableLoading(true);
    const request$ = this.isEditing && this.editingId !== null ? this.dictService.editDict({ id: this.editingId, code, name }) : this.dictService.addDict({ code, name });
    request$
      .pipe(
        finalize(() => {
          this.tableLoading(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.isModalVisible = false;
        this.getDataList({ pageIndex: 1 });
      });
  }

  private initTable(): void {
    this.tableConfig.set({
      showCheckbox: false,
      headers: [
        {
          title: 'ID',
          field: 'id',
          width: 100
        },
        {
          title: '字典编码',
          field: 'code',
          width: 180
        },
        {
          title: '字典名称',
          field: 'name',
          width: 180
        },
        {
          title: '操作',
          tdTemplate: this.operationTpl(),
          width: 140,
          fixed: true
        }
      ],
      total: 0,
      loading: true,
      pageSize: 10,
      pageIndex: 1
    });
  }
}
