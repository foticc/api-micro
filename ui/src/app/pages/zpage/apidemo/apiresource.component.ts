import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { ApiResource, ApiResourceService } from '@app/pages/zpage/apidemo/apiresource.service';
import { FormsComponent } from '@app/pages/zpage/apidemo/forms/apiresource.forms.component';
import { SearchCommonVO } from '@core/services/types';
import { AntTableComponent, AntTableConfig } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { AuthDirective } from '@shared/directives/auth.directive';
import { ModalBtnStatus, ModalWrapService } from '@widget/base-modal';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzIconDirective } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-holiday',
  imports: [AntTableComponent, AuthDirective, CardTableWrapComponent, NzButtonComponent, NzIconDirective],
  templateUrl: './apiresource.component.html',
  standalone: true,
  styleUrl: './apiresource.component.less'
})
export class ApiResourceComponent implements OnInit {
  @ViewChild('operationTpl', { static: true }) operationTpl!: TemplateRef<NzSafeAny>;

  tableConfig!: AntTableConfig;

  dataList: ApiResource[] = [];

  private apiResourceService = inject(ApiResourceService);
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(ModalWrapService);
  destroyRef = inject(DestroyRef);

  getDataList(e?: { pageIndex: number }): void {
    this.tableConfig.loading = true;
    const params: SearchCommonVO<NzSafeAny> = {
      page: e?.pageIndex || this.tableConfig.pageIndex!,
      size: this.tableConfig.pageSize!,
      filters: {}
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

  del(id: number[]): void {
    this.apiResourceService.delete(id).subscribe(res => {
      this.reloadTable();
    });
  }

  edit(id: any, ctx: any): void {}

  ngOnInit(): void {
    this.initTable();
  }

  reloadTable(): void {
    this.getDataList();
  }

  private initTable(): void {
    this.tableConfig = {
      showCheckbox: false,
      headers: [
        {
          title: '',
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
          width: 120,
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
}
