import { ChangeDetectorRef, Component, DestroyRef, inject, TemplateRef, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AcDetailService } from '@app/pages/zpage/api/acdetail.service';
import { Clients } from '@app/pages/zpage/api/client.service';
import { FormsComponent } from '@app/pages/zpage/clients/forms/forms.component';
import { SearchCommonVO } from '@core/services/types';
import { AntTableComponent, AntTableConfig, SortFile } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderType } from '@shared/components/page-header/page-header.component';
import { ModalBtnStatus, ModalWrapService } from '@widget/base-modal';
import { NzBadgeComponent } from 'ng-zorro-antd/badge';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveDirective } from 'ng-zorro-antd/core/wave';
import { NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzColDirective, NzRowDirective } from 'ng-zorro-antd/grid';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableQueryParams } from 'ng-zorro-antd/table';

interface SearchParam {
  name: string;
  desc: string;
}
@Component({
  selector: 'app-tvcms',
  imports: [
    NzBadgeComponent,
    NzButtonComponent,
    NzCardComponent,
    NzIconDirective,
    CardTableWrapComponent,
    AntTableComponent,
    FormsModule,
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzInputDirective,
    NzRowDirective,
    NzWaveDirective
  ],
  templateUrl: './tvcms.component.html',
  standalone: true,
  styleUrl: './tvcms.component.less'
})
export class TvcmsComponent implements OnInit {
  searchParam: Partial<SearchParam> = {};
  @ViewChild('highLightTpl', { static: true }) highLightTpl!: TemplateRef<NzSafeAny>;
  @ViewChild('operationTpl', { static: true }) operationTpl!: TemplateRef<NzSafeAny>;
  isCollapse = true;
  tableConfig!: AntTableConfig;
  pageHeaderInfo: Partial<PageHeaderType> = {
    title: '查询表格（表头可拖动，点击列表的"查看"按钮，演示在当前tab打开详情操作，如果需要新开tab展示详情，请跳转到"功能>页签操作"中查看演示效果）',
    // desc: '表单页用于向用户收集或验证信息，基础表单常见于数据项较少的表单场景。',
    breadcrumb: ['首页', '列表页', '查询表格']
  };
  checkedCashArray: NzSafeAny[] = []; // 需修改为对应业务的数据类型
  dataList: NzSafeAny[] = []; // 需修改为对应业务的数据类型
  destroyRef = inject(DestroyRef);

  private modalSrv = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private modalWrapService = inject(ModalWrapService);
  private api = inject(AcDetailService);

  // 最左侧复选框选中触发
  selectedChecked(e: NzSafeAny): void {
    console.log(e);
    this.checkedCashArray = [...e];
  }

  // 刷新页面
  reloadTable(): void {
    this.message.info('已经刷新了');
    this.getDataList();
  }

  // 触发表格变更检测
  tableChangeDectction(): void {
    // 改变引用触发变更检测。
    this.dataList = [...this.dataList];
    this.cdr.detectChanges();
  }

  tableLoading(isLoading: boolean): void {
    this.tableConfig.loading = isLoading;
    this.tableChangeDectction();
  }

  getDataList(e?: NzTableQueryParams): void {
    this.tableConfig.loading = true;
    const params = {
      size: this.tableConfig.pageSize!,
      page: e?.pageIndex || this.tableConfig.pageIndex!,
      ...this.searchParam
    };
    this.api
      .fetchPage(params)
      .pipe(
        finalize(() => {
          this.tableLoading(false);
        })
      )
      .subscribe(result => {
        const { content, page } = result;
        this.dataList = [...content];
        this.tableConfig.total = page.totalElements;
        this.tableConfig.pageSize = page.size;
        this.tableConfig.pageIndex = page.number;
      });
    /*-----实际业务请求http接口如下------*/
    // this.tableConfig.loading = true;
    // const params: SearchCommonVO<NzSafeAny> = {
    //   pageSize: this.tableConfig.pageSize!,
    //   pageNum: e?.pageIndex || this.tableConfig.pageIndex!,
    //   filters: this.searchParam
    // };
    // this.dataService.getFireSysList(params).pipe(finalize(() => {
    //   this.tableLoading(false);
    // })).subscribe((data => {
    //   const {list, total, pageNum} = data;
    //   this.dataList = [...list];
    //   this.tableConfig.total = total!;
    //   this.tableConfig.pageIndex = pageNum!;
    //   this.tableLoading(false);
    //   this.checkedCashArray = [...this.checkedCashArray];
    // }));
  }

  /*重置*/
  resetForm(): void {
    this.searchParam = {};
    this.getDataList();
  }

  /*展开*/
  toggleCollapse(): void {
    this.isCollapse = !this.isCollapse;
  }

  /*查看*/
  check(id: any): void {
    // skipLocationChange导航时不要把新状态记入历史时设置为true
    // this.router.navigate(['default/page-demo/list/search-table/search-table-detail', name, 123]);
    console.log(id);
    // this.api
    //   .getOne(id)
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(res => {
    //     this.modalWrapService.show<FormsComponent, Clients>(FormsComponent, { nzTitle: '查看', nzDraggable: false, nzOnOk: () => {} }, res).subscribe(res => {});
    //   });
  }

  add(): void {
    // this.modalService.show({nzTitle: '新增'}).subscribe((res) => {
    //   if (!res || res.status === ModalBtnStatus.Cancel) {
    //     return;
    //   }
    //   this.tableLoading(true);
    //   this.addEditData(res.modalValue, 'addFireSys');
    // }, error => this.tableLoading(false));
    this.modalWrapService
      .show<FormsComponent, Clients>(FormsComponent, {
        nzTitle: '新增'
      })
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
      });
  }

  // 修改
  edit(id: number, row: any): void {
    // this.dataService.getFireSysDetail(id).subscribe(res => {
    //   this.modalService.show({nzTitle: '编辑'}, res).subscribe(({modalValue, status}) => {
    //     if (status === ModalBtnStatus.Cancel) {
    //       return;
    //     }
    //     modalValue.id = id;
    //     this.tableLoading(true);
    //     this.addEditData(modalValue, 'editFireSys');
    //   }, error => this.tableLoading(false));
    // });
    this.modalWrapService.show<FormsComponent, Clients>(FormsComponent, { nzTitle: '编辑', nzDraggable: false, nzOnOk: () => {} }, row).subscribe(res => {});
  }

  // addEditData(param: FireSysObj, methodName: 'editFireSys' | 'addFireSys'): void {
  //   this.dataService[methodName](param).subscribe(() => {
  //     this.getDataList();
  //   });
  // }

  del(id: string): void {
    this.modalSrv.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.tableLoading(true);
        /*注释的是模拟接口调用*/
        this.api.delete(id).subscribe(res => {
          this.getDataList();
          this.tableLoading(false);
        });
      }
    });
  }

  allDel(): void {
    if (this.checkedCashArray.length > 0) {
      this.modalSrv.confirm({
        nzTitle: '确定要删除吗？',
        nzContent: '删除后不可恢复',
        nzOnOk: () => {
          const tempArrays: number[] = [];
          this.checkedCashArray.forEach(item => {
            tempArrays.push(item.id);
          });
          this.tableLoading(true);
          // 注释的是模拟接口的调用
          // this.dataService.delFireSys(tempArrays).subscribe(() => {
          //   if (this.dataList.length === 1) {
          //     this.tableConfig.pageIndex--;
          //   }
          //   this.getDataList();
          //   this.checkedCashArray = [];
          // }, error => this.tableLoading(false));
          setTimeout(() => {
            this.message.info(`id数组(支持分页保存):${JSON.stringify(tempArrays)}`);
            this.getDataList();
            this.checkedCashArray = [];
            this.tableLoading(false);
          }, 1000);
        }
      });
    } else {
      this.message.error('请勾选数据');
      return;
    }
  }

  changeSort(e: SortFile): void {
    this.message.info(`排序字段：${e.fileName},排序为:${e.sortDir}`);
  }

  // 修改一页几条
  changePageSize(e: number): void {
    this.tableConfig.pageSize = e;
  }

  private initTable(): void {
    /*
     * 注意，这里需要留一列不要设置width，让列表自适应宽度
     *
     * */
    this.tableConfig = {
      headers: [
        {
          title: 'id',
          width: 130,
          field: 'vodId',
          show: true
        },
        {
          title: 'vodName',
          field: 'vodName',
          show: true
        },
        {
          title: '操作',
          tdTemplate: this.operationTpl,
          width: 120,
          fixed: true,
          fixedDir: 'right'
        }
      ],
      keyField: 'vodId',
      total: 0,
      showCheckbox: true,
      loading: false,
      pageSize: 10,
      pageIndex: 1
    };
  }

  ngOnInit(): void {
    this.initTable();
  }
}
