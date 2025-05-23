import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { Dict, DictService } from '@app/pages/zpage/api/dict.service';
import { SearchCommonVO } from '@core/services/types';
import { AntTableComponent, AntTableConfig } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { AuthDirective } from '@shared/directives/auth.directive';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { ModalWrapService } from '@widget/base-modal';
import { FormsComponent } from '@app/pages/zpage/dictdemo/forms/forms.component';

@Component({
  selector: 'app-dictdemo',
  imports: [AntTableComponent, AuthDirective, CardTableWrapComponent, NzButtonComponent, NzIconDirective],
  templateUrl: './dictdemo.component.html',
  standalone: true,
  styleUrl: './dictdemo.component.less'
})
export class DictdemoComponent implements OnInit {
  tableConfig!: AntTableConfig;

  dataList: Dict[] = [];

  private dictService = inject(DictService);
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
    this.dictService
      .getDictPage(params)
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
    this.modalService.show<FormsComponent, Dict>(FormsComponent).subscribe(res => {
      console.log(res);
    });
  }

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
          title: 'id',
          field: 'id',
          width: 100
        },
        {
          title: 'code',
          width: 70,
          field: 'code'
        },
        {
          title: 'value',
          width: 100,
          field: 'value'
        },
        {
          title: 'desc',
          width: 100,
          field: 'desc'
        }
      ],
      total: 0,
      loading: true,
      pageSize: 10,
      pageIndex: 1
    };
  }
}
