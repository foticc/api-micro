import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, TemplateRef, inject, DestroyRef, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ActionCode } from '@app/config/actionCode';
import { OptionsInterface, SearchCommonVO } from '@core/services/types';
import { TestMenuListObj, TestMenuModalData } from '@app/pages/system/test/models/test-menu.models';
import { buildMenuCodePrefix, buildMenuPathPrefix, isMenuExternalLink, stripMenuPrefix } from '@app/pages/system/test/shared/menu-prefix.util';
import { TestMenuModalService } from '@app/pages/system/test/menu/services/test-menu-modal.service';
import { TestMenusService } from '@app/pages/system/test/menu/services/test-menus.service';
import { AntTableConfig, SortFile } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TreeNodeInterface, TreeTableComponent } from '@shared/components/tree-table/tree-table.component';
import { AuthDirective } from '@shared/directives/auth.directive';
import { MapKeyType, MapPipe, MapSet } from '@shared/pipes/map.pipe';
import { fnFlatDataHasParentToTree, fnFlattenTreeDataByDataList, fnSortTreeData } from '@utils/treeTableTools';
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
import { WaterMarkComponent } from '@shared/components/water-mark/water-mark.component';

interface SearchParam {
  menuName: string;
  visible: boolean;
}

/**
 * 测试模块内的菜单管理页，与 `system/menu` 行为对齐，路由隔离在 RBAC 试验下。
 */
@Component({
  selector: 'app-test-menu',
  templateUrl: './test-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    NzCardModule,
    FormsModule,
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
    AuthDirective,
    WaterMarkComponent
  ]
})
export class TestMenuComponent implements OnInit {
  readonly zorroIconTpl = viewChild.required<TemplateRef<NzSafeAny>>('zorroIconTpl');
  readonly aliIconTpl = viewChild.required<TemplateRef<NzSafeAny>>('aliIconTpl');
  readonly operationTpl = viewChild.required<TemplateRef<NzSafeAny>>('operationTpl');
  readonly visibleTpl = viewChild.required<TemplateRef<NzSafeAny>>('visibleTpl');
  readonly newLinkFlag = viewChild.required<TemplateRef<NzSafeAny>>('newLinkFlag');

  ActionCode = ActionCode;
  searchParam: Partial<SearchParam> = {};
  destroyRef = inject(DestroyRef);
  tableConfig = signal<AntTableConfig>({ headers: [], total: 0, showCheckbox: false, loading: false, pageSize: 10, pageIndex: 1 });
  readonly pageHeaderInfo: Partial<PageHeaderType> = {
    title: '菜单管理（测试）',
    breadcrumb: ['首页', '系统管理', 'RBAC 试验', '菜单管理']
  };
  dataList = signal<TreeNodeInterface[]>([]);
  readonly visibleOptions: OptionsInterface[] = [...MapPipe.transformMapToArray(MapSet.visible, MapKeyType.Boolean)];

  private menuModalService = inject(TestMenuModalService);
  private dataService = inject(TestMenusService);
  private modalSrv = inject(NzModalService);
  private message = inject(NzMessageService);

  reloadTable(): void {
    this.message.info('已经刷新了');
    this.getDataList();
  }

  tableLoading(isLoading: boolean): void {
    this.tableConfig.update(config => ({ ...config, loading: isLoading }));
  }

  getDataList(sortFile?: SortFile): void {
    this.tableLoading(true);
    const params: SearchCommonVO<NzSafeAny> = {
      pageSize: 0,
      pageIndex: 0,
      filters: this.searchParam
    };
    this.dataService
      .getMenuList(params)
      .pipe(
        finalize(() => {
          this.tableLoading(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(menuList => {
        const target = fnFlatDataHasParentToTree(menuList, 'fatherId');
        let list = fnFlattenTreeDataByDataList(target);
        if (sortFile) {
          fnSortTreeData(list, sortFile);
        }
        this.dataList.set(list);
        this.tableLoading(false);
      });
  }

  resetForm(): void {
    this.searchParam = {};
    this.getDataList();
  }

  add(fatherId: number): void {
    const initialData = fatherId > 0 ? this.buildChildMenuDefaults(fatherId) : undefined;
    this.menuModalService
      .show({ nzTitle: '新增' }, initialData)
      .pipe(
        finalize(() => {
          this.tableLoading(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(res => {
        if (!res || res.status === ModalBtnStatus.Cancel) {
          return;
        }
        const param = { ...res.modalValue };
        param.fatherId = fatherId;
        this.tableLoading(true);
        this.addEditData(param, 'addMenus');
      });
  }

  addEditData(param: TestMenuListObj, methodName: 'editMenus' | 'addMenus'): void {
    this.dataService[methodName](param)
      .pipe(
        finalize(() => {
          this.tableLoading(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.getDataList();
      });
  }

  del(id: number): void {
    this.modalSrv.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.tableLoading(true);
        this.dataService
          .delMenus(id)
          .pipe(
            finalize(() => {
              this.tableLoading(false);
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            if (this.dataList().length === 1 && this.tableConfig().pageIndex !== 1) {
              this.tableConfig.update(c => ({ ...c, pageIndex: c.pageIndex! - 1 }));
            } else {
              this.getDataList();
            }
          });
      }
    });
  }

  edit(id: number, fatherId: number): void {
    this.dataService
      .getMenuDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.menuModalService
          .show({ nzTitle: '编辑' }, this.buildModalDataWithPrefixes(res, fatherId))
          .pipe(
            finalize(() => {
              this.tableLoading(false);
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            modalValue.id = id;
            modalValue.fatherId = fatherId;
            this.tableLoading(true);
            this.addEditData(modalValue, 'editMenus');
          });
      });
  }

  changePageSize(e: number): void {
    this.tableConfig.update(config => ({ ...config, pageSize: e }));
  }

  /** 添加下级时，用前置标签展示上级权限码与路由前缀 */
  private buildChildMenuDefaults(fatherId: number): TestMenuModalData | undefined {
    const prefixes = this.getParentMenuPrefixes(fatherId);
    return prefixes ? { menuType: 'C', ...prefixes } : undefined;
  }

  /** 编辑子级时，剥离前缀后回填表单，前缀仍用 addon 展示 */
  private buildModalDataWithPrefixes(data: TestMenuListObj, fatherId: number): TestMenuModalData {
    const prefixes = this.getParentMenuPrefixes(fatherId);
    if (!prefixes) {
      return { ...data };
    }
    const { codePrefix, pathPrefix } = prefixes;
    const external = isMenuExternalLink(data.newLinkFlag);
    return {
      ...data,
      codePrefix,
      pathPrefix: external ? undefined : pathPrefix,
      code: stripMenuPrefix(data.code, codePrefix),
      path: data.menuType === 'C' && !external ? stripMenuPrefix(data.path, pathPrefix) : data.path
    };
  }

  private getParentMenuPrefixes(fatherId: number): { codePrefix: string; pathPrefix: string } | undefined {
    const parent = this.dataList().find(item => item['id'] === fatherId);
    if (!parent || parent['menuType'] !== 'C' || isMenuExternalLink(parent['newLinkFlag'])) {
      return undefined;
    }
    return {
      codePrefix: buildMenuCodePrefix(String(parent['code'] ?? '')),
      pathPrefix: buildMenuPathPrefix(String(parent['path'] ?? ''))
    };
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
