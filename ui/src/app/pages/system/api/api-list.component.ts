import { ChangeDetectionStrategy, Component, inject, OnInit, TemplateRef, viewChild, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableQueryParams } from 'ng-zorro-antd/table';

import { ApiResource } from './models/api.models';
import { mockApiResources } from './models/api.mock';
import { ApiModalService } from '@widget/biz-widget/system/api-modal/api-modal.service';
import { ModalBtnStatus } from '@widget/base-modal';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { AntTableConfig, AntTableComponent } from '@shared/components/ant-table/ant-table.component';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';

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
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';

interface TableData {
  id: number;
  method: string;
  path: string;
  description?: string;
}

@Component({
  selector: 'app-api-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    NzTableModule,
    NzSpaceModule,
    NzSelectModule,
    CardTableWrapComponent,
    AntTableComponent
  ],
  templateUrl: './api-list.component.html',
  styles: `
    .normal-table-wrap {
      margin-top: 0;
    }
    .method-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .tag-get {
      background: #52c41a;
      color: #fff;
    }
    .tag-post {
      background: #1890ff;
      color: #fff;
    }
    .tag-put {
      background: #faad14;
      color: #fff;
    }
    .tag-delete {
      background: #f5222d;
      color: #fff;
    }
    .tag-patch {
      background: #722ed1;
      color: #fff;
    }
  `
})
export class ApiListComponent implements OnInit {
  readonly operationTpl = viewChild<TemplateRef<NzSafeAny>>('operationTpl');
  readonly methodTagTpl = viewChild<TemplateRef<NzSafeAny>>('methodTagTpl');

  readonly pageHeader = signal<Partial<PageHeaderType>>({
    title: 'API资源管理',
    breadcrumb: ['系统管理', 'API资源']
  });

  tableConfig = signal<AntTableConfig>({ headers: [], total: 0, showCheckbox: true, loading: false, pageSize: 10, pageIndex: 1 });
  dataList = signal<ApiResource[]>([...mockApiResources]);
  keyword = '';

  private modalService = inject(ApiModalService);
  private message = inject(NzMessageService);
  private modalSrv = inject(NzModalService);

  ngOnInit(): void {
    this.initTable();
    this.getDataList(1);
  }

  initTable(): void {
    this.tableConfig.set({
      showCheckbox: true,
      headers: [
        {
          title: '请求方法',
          field: 'method',
          width: 100,
          tdTemplate: this.methodTagTpl()!
        },
        {
          title: 'API路径',
          field: 'path',
          width: 250
        },
        {
          title: '描述',
          field: 'description'
        },
        {
          title: '操作',
          tdTemplate: this.operationTpl()!,
          width: 140,
          fixed: true
        }
      ],
      total: mockApiResources.length,
      loading: false,
      pageSize: 10,
      pageIndex: 1
    });
  }

  getDataList(pageIndex?: number): void {
    let list = [...mockApiResources];

    if (this.keyword.trim()) {
      const k = this.keyword.toLowerCase();
      list = list.filter(p => p.path.toLowerCase().includes(k) || p.description?.toLowerCase().includes(k));
    }

    const currentPageIndex = pageIndex || this.tableConfig().pageIndex!;
    const pageSize = this.tableConfig().pageSize!;
    const start = (currentPageIndex - 1) * pageSize;
    const pageData = list.slice(start, start + pageSize);

    this.tableConfig.update(c => ({
      ...c,
      total: list.length,
      pageIndex: currentPageIndex
    }));
    this.dataList.set(pageData);
  }

  search(): void {
    this.getDataList(1);
  }

  resetSearch(): void {
    this.keyword = '';
    this.getDataList(1);
  }

  changePageSize(e: number): void {
    this.tableConfig.update(c => ({ ...c, pageSize: e }));
    this.getDataList(1);
  }

  changePageIndex(e: NzTableQueryParams): void {
    this.getDataList(e.pageIndex);
  }

  add(): void {
    this.modalService.show({ nzTitle: '新增API' }).subscribe(res => {
      if (!res || res.status === ModalBtnStatus.Cancel) {
        return;
      }
      const payload = res.modalValue;
      if (this.dataList().some(p => p.path === payload.path && p.method === payload.method)) {
        this.message.warning('相同路径和方法的API已存在');
        return;
      }
      const nextId = Math.max(...this.dataList().map(p => p.id)) + 1;
      this.dataList.update(list => [...list, { id: nextId, ...payload }]);
      this.message.success('已创建');
      this.getDataList();
    });
  }

  edit(id: number): void {
    const api = this.dataList().find(x => x.id === id);
    if (!api) {
      return;
    }

    this.modalService.show({ nzTitle: '编辑API' }, api).subscribe(res => {
      if (!res || res.status === ModalBtnStatus.Cancel) {
        return;
      }
      const payload = res.modalValue;
      if (this.dataList().some(p => p.path === payload.path && p.method === payload.method && p.id !== id)) {
        this.message.warning('相同路径和方法的API已存在');
        return;
      }
      this.dataList.update(list => list.map(p => (p.id === id ? { ...p, ...payload } : p)));
      this.message.success('已更新');
      this.getDataList();
    });
  }

  del(id: number): void {
    this.modalSrv.confirm({
      nzTitle: '确定要删除吗？',
      nzContent: '删除后不可恢复',
      nzOnOk: () => {
        this.dataList.update(list => list.filter(p => p.id !== id));
        this.message.success('已删除');
        this.getDataList();
      }
    });
  }
}
