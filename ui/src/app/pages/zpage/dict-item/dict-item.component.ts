import { JsonPipe } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, effect, inject, input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { Dict } from '@app/pages/zpage/dict/dict.service';
import { DictItem, DictItemService } from '@app/pages/zpage/dict-item/dict-item.service';
import { DictItemFormsComponent } from '@app/pages/zpage/dict-item/forms/dict-item.forms.component';
import { AntTableComponent, AntTableConfig } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { AuthDirective } from '@shared/directives/auth.directive';
import { ModalBtnStatus, ModalWrapService } from '@widget/base-modal';

import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzIconDirective } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-dict-item',
  imports: [AntTableComponent, AuthDirective, CardTableWrapComponent, NzButtonComponent, NzIconDirective, JsonPipe],
  template: `
    <app-card-table-wrap [btnTpl]="tableBtns" [tableTitle]="name" (reload)="reloadTable()">
      <app-ant-table [tableConfig]="tableConfig" [tableData]="dataList"></app-ant-table>
      <ng-template #operationTpl let-ctx="$$dataItem" let-id="id">
        <span class="operate-text" (click)="del([id])">删除</span>
        <span class="operate-text" (click)="edit(id, ctx)">编辑</span>
      </ng-template>
    </app-card-table-wrap>
    <ng-template #tableBtns>
      <button class="m-r-8" nz-button nzType="primary" (click)="add()">
        <i nz-icon nzType="plus"></i>
        新建
      </button>
    </ng-template>
  `,
  standalone: true,
  styleUrl: './dict-item.component.less'
})
export class DictItemComponent implements OnInit {
  @ViewChild('operationTpl', { static: true }) operationTpl!: TemplateRef<NzSafeAny>;

  readonly dict = input.required<Dict>();

  name: string = '';

  tableConfig!: AntTableConfig;

  dataList: DictItem[] = [];

  private apiService = inject(DictItemService);
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(ModalWrapService);
  destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const dict = this.dict();
      if (dict && dict.id) {
        this.getDataList(dict.id);
        this.name = dict.name;
      }
    });
  }

  getDataList(id: number): void {
    this.tableConfig.loading = true;
    this.apiService
      .listByDictId(id)
      .pipe(
        finalize(() => {
          this.tableLoading(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.dataList = [...data];
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

  add(): void {
    this.modalService.showAsync<DictItemFormsComponent, Dict>(DictItemFormsComponent, { nzTitle: '新增' }, this.dict()).subscribe(res => {
      if (!res || res.status === ModalBtnStatus.Cancel) {
        return;
      }
      this.reloadTable();
    });
  }

  del(id: number[]): void {
    this.apiService.delete(id).subscribe(res => {
      this.reloadTable();
    });
  }

  edit(id: number, ctx: DictItem): void {
    this.apiService.getOne(id).subscribe(res => {
      console.log(res);
    });
  }

  ngOnInit(): void {
    this.initTable();
  }

  reloadTable(): void {
    const id = this.dict()?.id;
    if (id) {
      this.getDataList(id);
    }
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
          title: '字典名称',
          field: 'label',
          width: 100
        },
        {
          title: '字典值',
          field: 'value',
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
