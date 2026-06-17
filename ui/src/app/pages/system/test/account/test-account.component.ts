import { AfterViewInit, Component, ChangeDetectionStrategy, TemplateRef, inject, DestroyRef, viewChild, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { ActionCode } from '@app/config/actionCode';
import { TestUser } from '@app/pages/system/test/models/test-account.models';
import { TestAccountModalService } from '@app/pages/system/test/account/services/test-account-modal.service';
import { TestAccountService } from '@app/pages/system/test/account/services/test-account.service';
import { OptionsInterface } from '@core/services/types';
import { AntTableConfig, AntTableComponent, SortFile } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { AuthDirective } from '@shared/directives/auth.directive';
import { MapKeyType, MapPipe, MapSet } from '@shared/pipes/map.pipe';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';

interface SearchParam {
  userName: string;
  mobile: string;
  available: boolean;
}

/**
 * RBAC 试验模块内的账号管理，与 `system/account` 行为对齐，API 走 `/rbac/users/*`。
 */
@Component({
  selector: 'app-test-account',
  templateUrl: './test-account.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    NzGridModule,
    NzCardModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    CardTableWrapComponent,
    AntTableComponent,
    NzTagModule,
    AuthDirective
  ]
})
export class TestAccountComponent implements AfterViewInit {
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly availableTpl = viewChild.required<TemplateRef<NzSafeAny>>('availableTpl');
  searchParam: Partial<SearchParam> = {};
  readonly pageHeaderInfo: Partial<PageHeaderType> = {
    title: '账号管理（测试）',
    breadcrumb: ['首页', '系统管理', 'RBAC 试验', '账号管理'],
    desc: '试验环境账号管理，数据与正式账号模块隔离。'
  };
  checkedCashArray: TestUser[] = [];
  ActionCode = ActionCode;
  isCollapse = true;
  readonly availableOptions: OptionsInterface[] = [...MapPipe.transformMapToArray(MapSet.available, MapKeyType.Boolean)];
  destroyRef = inject(DestroyRef);

  private dataService = inject(TestAccountService);
  private modalSrv = inject(NzModalService);
  private modalService = inject(TestAccountModalService);
  private message = inject(NzMessageService);

  private requestPageSize = signal(10);
  private requestPageIndex = signal(1);
  private searchFilters = signal<Partial<SearchParam>>({});
  /** 服务端排序：userName,asc / lastLoginTime,desc */
  private sortParam = signal<string | undefined>(undefined);

  accountResource = this.dataService.getAccountResource(() => ({
    pageSize: this.requestPageSize(),
    pageIndex: this.requestPageIndex(),
    filters: this.searchFilters() as NzSafeAny,
    sort: this.sortParam()
  }));

  dataList = computed(() => {
    if (this.accountResource.hasValue()) {
      return [...this.accountResource.value().list];
    }
    return [] as TestUser[];
  });

  tableConfig = signal<AntTableConfig>({ headers: [], total: 0, showCheckbox: true, loading: false, pageSize: 10, pageIndex: 1 });

  private syncTableConfig = effect(() => {
    const isLoading = this.accountResource.isLoading();
    const hasValue = this.accountResource.hasValue();
    this.tableConfig.update(c => ({
      ...c,
      loading: isLoading,
      ...(hasValue
        ? {
            total: this.accountResource.value().total!,
            pageIndex: this.accountResource.value().pageIndex!
          }
        : {})
    }));
  });

  selectedChecked(e: TestUser[]): void {
    this.checkedCashArray = [...e];
  }

  resetForm(): void {
    this.searchParam = {};
    this.sortParam.set(undefined);
    this.searchFilters.set({});
    this.requestPageIndex.set(1);
    this.tableConfig.update(c => ({
      ...c,
      headers: c.headers.map(h => ({ ...h, sortDir: undefined }))
    }));
  }

  changeSort(e: SortFile): void {
    this.sortParam.set(e.sortDir ? `${e.fileName},${e.sortDir}` : undefined);
    this.requestPageIndex.set(1);
  }

  getDataList(pageIndex: number): void {
    this.searchFilters.set({ ...this.searchParam });
    this.requestPageIndex.set(pageIndex);
  }

  add(): void {
    this.modalService
      .show({ nzTitle: '新增' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        this.addEditData(res.modalValue, 'addAccount');
      });
  }

  reloadTable(): void {
    this.accountResource.reload();
    this.message.info('刷新成功');
  }

  edit(id: number): void {
    this.dataService
      .getAccountDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.modalService
          .show({ nzTitle: '编辑' }, res)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            modalValue.id = id;
            this.addEditData(modalValue, 'editAccount');
          });
      });
  }

  addEditData(param: TestUser, methodName: 'editAccount' | 'addAccount'): void {
    this.dataService[methodName](param)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.accountResource.reload();
      });
  }

  allDel(): void {
    if (this.checkedCashArray.length === 0) {
      this.message.error('请勾选数据');
      return;
    }
    const tempArrays: number[] = this.checkedCashArray.map(item => item.id);
    this.modalSrv.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.dataService
          .delAccount(tempArrays)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            if (this.dataList().length === 1) {
              this.requestPageIndex.update(p => Math.max(1, p - 1));
            } else {
              this.accountResource.reload();
            }
            this.checkedCashArray = [];
          });
      }
    });
  }

  del(id: number): void {
    this.modalSrv.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.dataService
          .delAccount([id])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.requestPageIndex.update(p => Math.max(1, p - 1));
            } else {
              this.accountResource.reload();
            }
          });
      }
    });
  }

  changePageSize(e: number): void {
    this.requestPageSize.set(e);
    this.requestPageIndex.set(1);
  }

  toggleCollapse(): void {
    this.isCollapse = !this.isCollapse;
  }

  ngAfterViewInit(): void {
    this.initTable();
  }

  private initTable(): void {
    this.tableConfig.set({
      showCheckbox: true,
      headers: [
        { title: '用户名称', field: 'userName', width: 100, showSort: true },
        { title: '是否可用', width: 100, field: 'available', tdTemplate: this.availableTpl() },
        { title: '性别', width: 70, field: 'sex', pipe: 'sex' },
        { title: '手机', width: 100, field: 'mobile' },
        { title: '邮箱', width: 100, field: 'email' },
        { title: '最后登录时间', width: 120, field: 'lastLoginTime', pipe: 'date:yyyy-MM-dd HH:mm', showSort: true },
        { title: '创建时间', width: 100, field: 'createdAt', pipe: 'date:yyyy-MM-dd HH:mm' },
        { title: '电话', width: 100, field: 'telephone' },
        { title: '操作', tdTemplate: this.operationTpl(), width: 150, fixed: true }
      ],
      total: 0,
      loading: true,
      pageSize: 10,
      pageIndex: 1
    });
  }
}
