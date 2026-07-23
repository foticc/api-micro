import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, TemplateRef, inject, DestroyRef, signal, viewChild, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';

import { ActionCode } from '@app/config/actionCode';
import { OptionsInterface } from '@core/services/types';
import { MenuListObj, MenusService } from '@services/system/menus.service';
import { AntTableConfig, SortFile } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TreeNodeInterface, TreeTableComponent } from '@shared/components/tree-table/tree-table.component';
import { WaterMarkComponent } from '@shared/components/water-mark/water-mark.component';
import { AuthDirective } from '@shared/directives/auth.directive';
import { MapKeyType, MapPipe, MapSet } from '@shared/pipes/map.pipe';
import { fnFlatDataHasParentToTree, fnFlattenTreeDataByDataList, fnSortTreeData } from '@utils/treeTableTools';
import { ModalBtnStatus } from '@widget/base-modal';
import { MenuModalService } from '@widget/biz-widget/system/menu-modal/menu-modal.service';

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
  menuName: string;
  visible: boolean | null;
}

const DEFAULT_SEARCH_PARAM: SearchParam = {
  menuName: '',
  visible: null
};

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',

  imports: [
    PageHeaderComponent,
    WaterMarkComponent,
    NzCardModule,
    FormField,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    CardTableWrapComponent,
    TreeTableComponent,
    NgTemplateOutlet,
    NzTagModule,
    AuthDirective
  ]
})
export class MenuComponent implements OnInit {
  readonly zorroIconTpl = viewChild.required<TemplateRef<NzSafeAny>>('zorroIconTpl');
  readonly aliIconTpl = viewChild.required<TemplateRef<NzSafeAny>>('aliIconTpl');
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly visibleTpl = viewChild.required<TemplateRef<NzSafeAny>>('visibleTpl');
  readonly newLinkFlag = viewChild.required<TemplateRef<NzSafeAny>>('newLinkFlag');

  ActionCode = ActionCode;
  searchModel = signal<SearchParam>({ ...DEFAULT_SEARCH_PARAM });
  searchForm = form(this.searchModel);
  readonly pageHeaderInfo: Partial<PageHeaderType> = {
    title: '菜单管理,新增完菜单记得给对应角色添加刚刚新增的菜单权限，不然无法展示',
    breadcrumb: ['首页', '系统管理', '菜单管理']
  };
  readonly visibleOptions: OptionsInterface[] = [...MapPipe.transformMapToArray(MapSet.visible, MapKeyType.Boolean)];

  private dataService = inject(MenusService);
  private menuModalService = inject(MenuModalService);
  private modalSrv = inject(NzModalService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  private searchFilters = signal<Partial<SearchParam>>({});
  private currentSortFile = signal<SortFile | undefined>(undefined);

  menuResource = this.dataService.getMenuListResource(() => ({
    pageSize: 0,
    pageIndex: 0,
    filters: this.searchFilters() as NzSafeAny
  }));

  dataList = computed(() => {
    if (!this.menuResource.hasValue()) {
      return [] as TreeNodeInterface[];
    }
    const menuList = this.menuResource.value();
    const target = fnFlatDataHasParentToTree(menuList.list, 'fatherId');
    const list = fnFlattenTreeDataByDataList(target);
    // 因为前段要对后端返回的数据进行处理，所以排序这里交给了前段来做
    const sortFile = this.currentSortFile();
    if (sortFile) {
      fnSortTreeData(list, sortFile);
    }
    return list;
  });

  tableConfig = signal<AntTableConfig>({ headers: [], total: 0, showCheckbox: false, loading: false, pageSize: 10, pageIndex: 1 });

  private syncTableConfig = effect(() => {
    const isLoading = this.menuResource.isLoading();
    this.tableConfig.update(c => ({ ...c, loading: isLoading }));
  });

  reloadTable(): void {
    this.message.info('已经刷新了');
    this.menuResource.reload();
  }

  getDataList(sortFile?: SortFile): void {
    // 过滤掉空值,只传递有实际值的搜索条件
    const filters = Object.fromEntries(Object.entries(this.searchModel()).filter(([_, value]) => value !== null && value !== ''));
    this.searchFilters.set(filters);
    if (sortFile) {
      this.currentSortFile.set(sortFile);
    }
  }

  /*重置*/
  resetForm(): void {
    this.searchModel.set({ ...DEFAULT_SEARCH_PARAM });
    this.searchFilters.set({});
    this.currentSortFile.set(undefined);
    this.menuResource.reload();
  }

  add(fatherId: number): void {
    this.menuModalService
      .show({ nzTitle: '新增' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        const param = { ...res.modalValue };
        param.fatherId = fatherId;
        this.addEditData(param, 'addMenus');
      });
  }

  addEditData(param: MenuListObj, methodName: 'editMenus' | 'addMenus'): void {
    this.dataService[methodName](param)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.menuResource.reload();
      });
  }

  del(id: number): void {
    this.modalSrv.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.dataService
          .delMenus(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            // 例如分页第二页只有一条数据，此时删除这条数据，跳转到第一页，并重新查询一下列表,pageIndex改变会由changePageIndex自动触发表格查询getDataList（）
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.tableConfig.update(c => ({ ...c, pageIndex: c.pageIndex! - 1 }));
            } else {
              this.menuResource.reload();
            }
          });
      }
    });
  }

  // 修改
  edit(id: number, fatherId: number): void {
    this.dataService
      .getMenuDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.menuModalService
          .show({ nzTitle: '编辑' }, res)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            modalValue.id = id;
            modalValue.fatherId = fatherId;
            this.addEditData(modalValue, 'editMenus');
          });
      });
  }

  // 修改一页几条
  changePageSize(e: number): void {
    this.tableConfig.update(config => ({ ...config, pageSize: e }));
  }

  changeSort(e: SortFile): void {
    this.getDataList(e);
  }

  private initTable(): void {
    this.tableConfig.set({
      headers: [
        {
          title: '菜单名称',
          width: 230,
          field: 'menuName'
        },
        {
          title: 'zorro图标',
          field: 'icon',
          width: 100,
          tdTemplate: this.zorroIconTpl()
        },
        {
          title: '阿里图标',
          field: 'alIcon',
          width: 100,
          tdTemplate: this.aliIconTpl()
        },
        {
          title: '权限码',
          field: 'code',
          width: 300
        },
        {
          title: '路由地址',
          field: 'path',
          width: 300
        },
        {
          title: '排序',
          field: 'orderNum',
          width: 80
        },
        {
          title: '状态',
          field: 'status',
          pipe: 'available',
          width: 100
        },
        {
          title: '展示',
          field: 'visible',
          pipe: 'isOrNot',
          tdTemplate: this.visibleTpl(),
          width: 100
        },
        {
          title: '外链',
          field: 'newLinkFlag',
          pipe: 'isOrNot',
          tdTemplate: this.newLinkFlag(),
          width: 100
        },
        {
          title: '创建时间',
          field: 'createdAt',
          pipe: 'date:yyyy-MM-dd HH:mm',
          width: 180
        },
        {
          title: '更新时间',
          field: 'updatedAt',
          pipe: 'date:yyyy-MM-dd HH:mm',
          width: 180
        },
        {
          title: '操作',
          tdTemplate: this.operationTpl(),
          width: 180,
          fixed: true,
          fixedDir: 'right'
        }
      ],
      total: 0,
      showCheckbox: false,
      loading: false,
      pageSize: 10,
      pageIndex: 1
    });
  }

  ngOnInit(): void {
    this.initTable();
  }
}
