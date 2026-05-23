import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { RbacPermission, RbacPermissionPayload } from '../models/rbac.models';
import { mockPermissions, mockMenus } from '../models/rbac.mock';
import { RbacNavComponent } from '../shared/rbac-nav.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';

type ViewMode = 'list' | 'form';

interface TableData {
  id: number;
  code: string;
  name: string;
  menuCount: number;
  apiCount: number;
  description?: string;
}

@Component({
  selector: 'app-permission-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RbacNavComponent,
    FormsModule,
    ReactiveFormsModule,
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
    NzModalModule,
    NzTreeSelectModule,
    NzEmptyModule
  ],
  templateUrl: './permission-list.component.html',
  styles: `
    .normal-table-wrap {
      margin-top: 0;
    }
    .meta-text {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }
    .path-hint {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
      margin-bottom: 16px;
    }
    .section-title {
      font-weight: 600;
      margin-bottom: 12px;
    }
    .form-actions {
      margin-top: 24px;
      text-align: right;
    }
    .menu-tag {
      margin-right: 8px;
      margin-bottom: 4px;
    }
    .api-tag {
      margin-right: 8px;
      margin-bottom: 4px;
    }
  `
})
export class PermissionListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  viewMode = signal<ViewMode>('list');
  keyword = '';
  loading = signal(false);
  saving = signal(false);

  permissions = signal<RbacPermission[]>([...mockPermissions]);
  allMenus = mockMenus;

  pageList = signal<TableData[]>([]);
  total = signal(0);
  pageIndex = signal(1);
  pageSize = signal(10);

  editingId?: number;
  pathLabel = signal('系统管理 › 新权限');
  form!: FormGroup;

  readonly listPageHeader: Partial<PageHeaderType> = {
    title: '权限资源组',
    desc: '组合 API 和菜单资源，形成可授权的权限组。'
  };

  readonly formPageHeader = signal<Partial<PageHeaderType>>({
    title: '新增权限',
    desc: ''
  });



  readonly methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' }
  ];

  get apis(): FormArray {
    return this.form.get('apis') as FormArray;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadPage();
  }

  initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: [''],
      menuIds: [[] as number[]],
      apis: this.fb.array([])
    });
    this.form.valueChanges.subscribe(() => this.updatePathLabel());
  }

  loadPage(pageIndex = this.pageIndex()): void {
    let list = [...this.permissions()];

    if (this.keyword.trim()) {
      const k = this.keyword.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(k) ||
          p.code.toLowerCase().includes(k) ||
          (p.apis && p.apis.some(api => api.path.toLowerCase().includes(k))) ||
          p.menus?.some(m => m.name.toLowerCase().includes(k) || m.code.toLowerCase().includes(k))
      );
    }

    this.total.set(list.length);
    const start = (pageIndex - 1) * this.pageSize();
    const pageData = list.slice(start, start + this.pageSize());

    this.pageList.set(
      pageData.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        menuCount: p.menus?.length || 0,
        apiCount: p.apis?.length || 0,
        description: p.description
      }))
    );
    this.pageIndex.set(pageIndex);
  }

  search(): void {
    this.loadPage(1);
  }

  resetSearch(): void {
    this.keyword = '';
    this.loadPage(1);
  }

  onPageIndexChange(index: number): void {
    this.loadPage(index);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.loadPage(1);
  }

  openCreate(): void {
    this.editingId = undefined;
    this.formPageHeader.set({ title: '新增权限资源组', desc: '' });
    this.initForm();
    this.updatePathLabel();
    this.viewMode.set('form');
  }

  openEdit(row: TableData): void {
    const p = this.permissions().find(x => x.id === row.id);
    if (!p) {
      return;
    }

    this.editingId = p.id;
    this.formPageHeader.set({ title: '编辑权限资源组', desc: '' });
    this.initForm();
    this.patchForm(p);
    this.updatePathLabel(p.name);
    this.viewMode.set('form');
  }

  backToList(): void {
    this.viewMode.set('list');
    this.editingId = undefined;
  }

  createApiGroup(method = 'GET', path = '', description = ''): FormGroup {
    return this.fb.group({
      method: [method, Validators.required],
      path: [path, Validators.required],
      description: [description]
    });
  }

  patchForm(p: RbacPermission): void {
    this.apis.clear();
    if (p.apis && p.apis.length > 0) {
      p.apis.forEach(a => this.apis.push(this.createApiGroup(a.method, a.path, a.description ?? '')));
    }

    this.form.patchValue({
      code: p.code,
      name: p.name,
      description: p.description || '',
      menuIds: p.menuIds || []
    });
  }

  updatePathLabel(name?: string): void {
    const v = this.form?.getRawValue();
    if (!v) {
      return;
    }
    this.pathLabel.set(name ?? (v.name || '新权限'));
  }

  addApi(): void {
    this.apis.push(this.createApiGroup('POST', '', ''));
  }

  removeApi(i: number): void {
    this.apis.removeAt(i);
  }

  submitForm(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      this.apis.controls.forEach(c => c.markAsDirty());
      this.message.warning('请完善必填项');
      return;
    }

    const payload = this.form.getRawValue() as RbacPermissionPayload;
    const apis = payload.apis?.filter(a => a.path.trim()) || [];

    if (this.permissions().some(p => p.code === payload.code && p.id !== this.editingId)) {
      this.message.warning('权限编码已存在');
      return;
    }

    this.saving.set(true);

    setTimeout(() => {
      if (this.editingId != null) {
        const idx = this.permissions().findIndex(p => p.id === this.editingId);
        if (idx !== -1) {
          const menus = payload.menuIds?.map(id => this.allMenus.find(m => m.id === id)).filter(Boolean) as typeof this.allMenus;
          const { apis: _, ...rest } = payload;
          this.permissions.set([
            ...this.permissions().slice(0, idx),
            { id: this.editingId!, ...rest, menus, apis },
            ...this.permissions().slice(idx + 1)
          ]);
        }
        this.message.success('已更新');
      } else {
        const nextId = Math.max(...this.permissions().map(p => p.id)) + 1;
        const menus = payload.menuIds?.map(id => this.allMenus.find(m => m.id === id)).filter(Boolean) as typeof this.allMenus;
        const { apis: _, ...rest } = payload;
        this.permissions.set([
          ...this.permissions(),
          { id: nextId, ...rest, menus, apis }
        ]);
        this.message.success('已创建');
      }

      this.saving.set(false);
      this.backToList();
      this.loadPage(this.pageIndex());
    }, 300);
  }

  remove(row: TableData): void {
    this.modal.confirm({
      nzTitle: '确认删除',
      nzContent: `删除权限组「${row.name}」？`,
      nzOnOk: () => {
        this.permissions.set(this.permissions().filter(p => p.id !== row.id));
        this.message.success('已删除');
        this.loadPage(this.pageIndex());
      }
    });
  }

  getPermission(id: number): RbacPermission | undefined {
    return this.permissions().find(p => p.id === id);
  }

  getMenuTree() {
    const menuTree: any[] = [];
    const menus = this.allMenus.filter(m => m.type === 'menu');
    const buttons = this.allMenus.filter(m => m.type === 'button');

    menus.forEach(menu => {
      const menuButtons = buttons.filter(b => b.code.startsWith(menu.code.split(':')[1] + ':'));
      menuTree.push({
        title: menu.name,
        value: menu.id,
        key: menu.id,
        children: menuButtons.map(btn => ({
          title: btn.name,
          value: btn.id,
          key: btn.id
        }))
      });
    });

    return menuTree;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
