import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { Dict, DictService } from '@app/pages/zpage/dict/dict.service';
import { DictFormsComponent } from '@app/pages/zpage/dict/forms/dict.forms.component';
import { DictItem, DictItemService } from '@app/pages/zpage/dict-item/dict-item.service';
import { DictItemFormsComponent } from '@app/pages/zpage/dict-item/forms/dict-item.forms.component';
import { SearchCommonVO } from '@core/services/types';
import { ModalBtnStatus, ModalWrapService } from '@widget/base-modal';
import { NzBadgeComponent } from 'ng-zorro-antd/badge';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveDirective } from 'ng-zorro-antd/core/wave';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzDropDownDirective, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzColDirective, NzRowDirective } from 'ng-zorro-antd/grid';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzMenuDirective, NzMenuItemComponent } from 'ng-zorro-antd/menu';
import { NzTableModule } from 'ng-zorro-antd/table';

interface SearchParam {
  nameLike: string;
}

@Component({
  selector: 'app-holiday',
  imports: [
    NzIconDirective,
    NzTableModule,
    NzBadgeComponent,
    NzDropDownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzDividerComponent,
    FormsModule,
    NzButtonComponent,
    NzCardComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzInputDirective,
    NzRowDirective,
    NzWaveDirective
  ],
  templateUrl: './dict.component.html',
  standalone: true,
  styleUrl: './dict.component.less'
})
export class DictComponent implements OnInit {
  @ViewChild('operationTpl', { static: true }) operationTpl!: TemplateRef<NzSafeAny>;

  searchParam: Partial<SearchParam> = {};
  dataList: Dict[] = [];
  dataList2: DictItem[] = [];

  expandId = -1;

  private dictService = inject(DictService);
  private dictItemService = inject(DictItemService);
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(ModalWrapService);
  destroyRef = inject(DestroyRef);

  getDataList(e?: { pageIndex: number }): void {
    const params: SearchCommonVO<NzSafeAny> = {
      page: 1,
      size: 20,
      filters: this.searchParam
    };
    this.dictService
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
        this.tableLoading(false);
      });
  }

  tableLoading(isLoading: boolean): void {
    this.tableChangeDectction();
  }

  // 触发表格变更检测
  tableChangeDectction(): void {
    // 改变引用触发变更检测。
    this.dataList = [...this.dataList];
    this.cdr.detectChanges();
  }

  changePageSize(e: number): void {}

  allDel(): void {}

  add(): void {
    this.modalService.showAsync<DictFormsComponent, Dict>(DictFormsComponent, { nzTitle: '新增' }).subscribe(res => {
      if (!res || res.status === ModalBtnStatus.Cancel) {
        return;
      }
      this.reloadTable();
    });
  }

  del(id: number[]): void {
    this.dictService.delete(id).subscribe(res => {
      this.reloadTable();
    });
  }

  edit(id: any, ctx: any): void {}

  ngOnInit(): void {
    this.reloadTable();
  }

  reloadTable(): void {
    this.getDataList();
  }

  fetchItemList(dictId: number): void {
    this.dictItemService.listByDictId(dictId).subscribe(res => {
      this.dataList2 = [...res];
      this.tableChangeDectction();
    });
  }

  expandChange($event: boolean, id: number): void {
    this.expandId = id;
    if ($event) {
      this.fetchItemList(id);
    } else {
      this.dataList2 = [];
    }
  }

  addItem(id: number): void {
    this.modalService.showAsync<DictItemFormsComponent, number>(DictItemFormsComponent, { nzTitle: '添加' }, id).subscribe(res => {});
  }

  resetForm(): void {
    this.searchParam = {};
    this.getDataList({ pageIndex: 1 });
  }
}
