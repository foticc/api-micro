import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiResource, ApiResourceQuery, ApiResourceService } from '@app/pages/zpage/apidemo/api-resource.service';
import { FormsComponent } from '@app/pages/zpage/apidemo/forms/api-resource.forms.component';
import { SearchCommonVO } from '@core/services/types';
import { AntTableComponent, AntTableConfig, SortFile } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { AuthDirective } from '@shared/directives/auth.directive';
import { ModalBtnStatus, ModalWrapService } from '@widget/base-modal';

import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveDirective } from 'ng-zorro-antd/core/wave';
import { NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzColDirective, NzRowDirective } from 'ng-zorro-antd/grid';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-apiresource',
  imports: [
    AntTableComponent,
    AuthDirective,
    CardTableWrapComponent,
    NzButtonComponent,
    NzIconDirective,
    FormsModule,
    NzCardComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzInputDirective,
    NzRowDirective,
    NzWaveDirective,
    ReactiveFormsModule
  ],
  templateUrl: './api-resource.component.html',
  standalone: true,
  styleUrl: './api-resource.component.less'
})
export class ApiResourceComponent implements OnInit {
  @ViewChild('operationTpl', { static: true }) operationTpl!: TemplateRef<NzSafeAny>;

  tableConfig!: AntTableConfig;

  dataList: ApiResource[] = [];

  searchParam: Partial<ApiResourceQuery> = {};

  private apiResourceService = inject(ApiResourceService);
  private cdr = inject(ChangeDetectorRef);
  private modalSrv = inject(NzModalService);
  private modalService = inject(ModalWrapService);
  destroyRef = inject(DestroyRef);

  getDataList(e?: { pageIndex: number }): void {
    this.tableConfig.loading = true;
    const params: SearchCommonVO<NzSafeAny> = {
      page: e?.pageIndex || this.tableConfig.pageIndex!,
      size: this.tableConfig.pageSize!,
      filters: { ...this.searchParam }
    };
    this.apiResourceService
      .page(params)
      .pipe(
        finalize(() => {
          this.tableLoading(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        const { content, page } = data;
        this.dataList = [...content];
        this.tableConfig.total = page.totalElements!;
        this.tableConfig.pageIndex = page.number!;
        this.tableLoading(false);
      });
  }

  tableLoading(isLoading: boolean): void {
    this.tableConfig.loading = isLoading;
    this.tableChangeDectction();
  }

  // 触发表格变更检测
  tableChangeDectction(): void {
    // 改变引用触发变更检测。
    this.dataList = [...this.dataList];
    this.cdr.detectChanges();
  }

  changePageSize(e: number): void {
    this.tableConfig.pageSize = e;
  }

  allDel(): void {}

  add(): void {
    this.modalService.showAsync<FormsComponent, ApiResource>(FormsComponent, { nzTitle: '测试啊' }).subscribe(res => {
      if (!res || res.status === ModalBtnStatus.Cancel) {
        return;
      }
      this.reloadTable();
    });
  }

  delete(id: number[]): void {
    this.modalSrv.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.tableLoading(true);
        this.apiResourceService
          .delete(id)
          .pipe(
            finalize(() => {
              this.tableLoading(false);
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            this.reloadTable();
          });
      }
    });
  }

  edit(id: number, ctx: ApiResource): void {
    this.modalService.showAsync<FormsComponent, ApiResource>(FormsComponent, { nzTitle: '测试啊' }, ctx).subscribe(res => {
      if (!res || res.status === ModalBtnStatus.Cancel) {
        return;
      }
      this.reloadTable();
    });
  }

  ngOnInit(): void {
    this.initTable();
  }

  reloadTable(): void {
    this.getDataList();
  }

  resetForm(): void {
    this.searchParam = {};
    this.getDataList({ pageIndex: 1 });
  }

  private initTable(): void {
    this.tableConfig = {
      headers: [
        {
          title: 'id',
          field: 'id',
          width: 100
        },

        {
          title: 'method',
          field: 'method',
          width: 100
        },

        {
          title: 'path',
          field: 'path',
          width: 100
        },

        {
          title: 'description',
          field: 'description',
          width: 100
        },
        {
          title: '操作',
          tdTemplate: this.operationTpl,
          width: 30,
          fixed: true,
          fixedDir: 'right'
        }
      ],
      total: 0,
      loading: true,
      pageSize: 10,
      pageIndex: 1
    };
  }

  changeSort(event: SortFile): void {
    console.log(event);
  }

  checkedCashArray: ApiResource[] = [];

  selectedChecked(event: ApiResource[]): void {
    this.checkedCashArray = [...event];
    console.log(this.checkedCashArray);
  }
}
