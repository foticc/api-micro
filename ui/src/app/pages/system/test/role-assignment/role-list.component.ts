import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { RbacPermission, RbacRole } from '../models/rbac.models';
import { mockPermissions, mockRoles } from '../models/rbac.mock';
import { RbacNavComponent } from '../shared/rbac-nav.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';

type ViewMode = 'list' | 'assign';

interface AssignTreeNode {
  key: string;
  title: string;
  type: 'module' | 'permission';
  permissionId?: number;
  children?: AssignTreeNode[];
  checked: boolean;
  halfChecked: boolean;
}

@Component({
  selector: 'app-role-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RbacNavComponent,
    FormsModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzWaveModule,
    NzInputModule,
    NzCheckboxModule,
    NzCollapseModule,
    NzIconModule,
    NzSpaceModule,
    NzSwitchModule,
    NzEmptyModule
  ],
  templateUrl: './role-list.component.html',
  styles: `
    .assign-scroll {
      max-height: 420px;
      overflow: auto;
      border: 1px solid #f0f0f0;
      padding: 12px;
      border-radius: 4px;
    }
    .tree-node {
      padding: 4px 0;
    }
    .tree-node-perm {
      padding-left: 16px;
    }
    .muted {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }
  `
})
export class RoleListComponent implements OnInit {
  private message = inject(NzMessageService);

  viewMode = signal<ViewMode>('list');
  listLoading = signal(false);
  assignLoading = signal(false);
  saving = signal(false);

  roles = signal<RbacRole[]>([...mockRoles]);
  permissions = signal<RbacPermission[]>([...mockPermissions]);

  assignRoleId = 0;
  assignRoleName = '';
  assignRoleDesc = '';
  keyword = signal('');
  onlySelected = signal(false);
  private readonly filterTick = signal(0);

  allPermissions = signal<RbacPermission[]>([]);
  assignTree = signal<AssignTreeNode[]>([]);
  apiPreview = signal<{ method: string; path: string; description?: string }[]>([]);
  apiTotal = signal(0);
  expandedModuleKeys = signal<Set<string>>(new Set());

  readonly listPageHeader: Partial<PageHeaderType> = {
    title: '角色分配',
    desc: '为角色分配权限资源组。'
  };

  readonly assignPageHeader = signal<Partial<PageHeaderType>>({
    title: '分配权限',
    desc: ''
  });

  selectedCount = computed(() => this.collectPermissionIdsFromAssignTree(this.assignTree()).length);
  totalPermissionCount = computed(() => this.allPermissions().length);

  filteredTree = computed(() => {
    this.filterTick();
    const perms = this.filterPermissions(this.allPermissions(), this.keyword());
    const ids = new Set(this.collectPermissionIdsFromAssignTree(this.assignTree()));
    if (!this.onlySelected()) {
      return this.buildAssignTree(perms, ids);
    }
    return this.buildAssignTree(
      perms.filter(p => ids.has(p.id)),
      ids
    );
  });

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.listLoading.set(true);
    setTimeout(() => {
      this.roles.set([...mockRoles]);
      this.listLoading.set(false);
    }, 300);
  }

  private filterPermissions(permissions: RbacPermission[], keyword?: string): RbacPermission[] {
    if (!keyword?.trim()) {
      return permissions;
    }
    const k = keyword.toLowerCase();
    return permissions.filter(
      p =>
        p.name.toLowerCase().includes(k) ||
        p.code.toLowerCase().includes(k) ||
        (p.apis && p.apis.some(api => api.path.toLowerCase().includes(k))) ||
        p.menus?.some(m => m.name.toLowerCase().includes(k) || m.code.toLowerCase().includes(k))
    );
  }

  private buildAssignTree(permissions: RbacPermission[], selectedIds: Set<number>): AssignTreeNode[] {
    return permissions.map(p => {
      const isChecked = selectedIds.has(p.id);
      return {
        key: `perm:${p.id}`,
        title: `${p.name} [${p.code}]`,
        type: 'permission',
        permissionId: p.id,
        checked: isChecked,
        halfChecked: false
      };
    });
  }

  private collectPermissionIdsFromAssignTree(nodes: AssignTreeNode[]): number[] {
    const ids: number[] = [];
    const walk = (ns: AssignTreeNode[]) => {
      for (const n of ns) {
        if (n.type === 'permission' && n.checked && n.permissionId) {
          ids.push(n.permissionId);
        }
        if (n.children) {
          walk(n.children);
        }
      }
    };
    walk(nodes);
    return ids;
  }

  private toggleAssignNodeChecked(nodes: AssignTreeNode[], key: string, checked: boolean): AssignTreeNode[] {
    const result: AssignTreeNode[] = [];
    const walk = (ns: AssignTreeNode[]): AssignTreeNode[] => {
      return ns.map(n => {
        if (n.key === key) {
          const updated = { ...n, checked, halfChecked: false };
          return updated;
        }
        if (n.children) {
          const updatedChildren = walk(n.children);
          const childChecked = updatedChildren.filter(c => c.checked).length;
          return {
            ...n,
            children: updatedChildren,
            checked: childChecked === updatedChildren.length,
            halfChecked: childChecked > 0 && childChecked !== updatedChildren.length
          };
        }
        return n;
      });
    };
    return walk(nodes);
  }

  openAssign(role: RbacRole): void {
    this.assignRoleId = role.id;
    this.assignRoleName = role.roleName;
    this.assignRoleDesc = role.roleDesc ?? '';
    this.assignPageHeader.set({
      title: '分配权限',
      desc: `当前角色：${this.assignRoleName}${this.assignRoleDesc ? ' — ' + this.assignRoleDesc : ''}`
    });
    this.keyword.set('');
    this.onlySelected.set(false);
    this.assignLoading.set(true);
    this.viewMode.set('assign');

    setTimeout(() => {
      const perms = [...mockPermissions];
      this.allPermissions.set(perms);

      const roleData = mockRoles.find(r => r.id === role.id);
      const selected = new Set(roleData?.permissionIds ?? []);

      this.assignTree.set(this.buildAssignTree(perms, selected));
      this.expandedModuleKeys.set(new Set(this.assignTree().map(n => n.key)));
      this.refreshApiPreview();

      this.assignLoading.set(false);
    }, 300);
  }

  backToList(): void {
    this.viewMode.set('list');
    this.loadRoles();
  }

  onFilterChange(): void {
    this.filterTick.update(v => v + 1);
  }

  refreshApiPreview(): void {
    const ids = this.collectPermissionIdsFromAssignTree(this.assignTree());
    const list = this.permissions()
      .filter(p => ids.includes(p.id))
      .flatMap(p => p.apis || []);

    this.apiPreview.set(list);
    this.apiTotal.set(list.length);
  }

  onCheck(node: AssignTreeNode, checked: boolean): void {
    this.assignTree.set(this.toggleAssignNodeChecked(this.assignTree(), node.key, checked));
    this.refreshApiPreview();
  }

  toggleModuleExpand(key: string): void {
    const set = new Set(this.expandedModuleKeys());
    if (set.has(key)) {
      set.delete(key);
    } else {
      set.add(key);
    }
    this.expandedModuleKeys.set(set);
  }

  isModuleExpanded(key: string): boolean {
    return this.expandedModuleKeys().has(key);
  }

  expandAll(): void {
    this.expandedModuleKeys.set(new Set(this.assignTree().map(n => n.key)));
  }

  collapseAll(): void {
    this.expandedModuleKeys.set(new Set());
  }

  submitAssign(): void {
    const ids = this.collectPermissionIdsFromAssignTree(this.assignTree());
    this.saving.set(true);

    setTimeout(() => {
      const idx = this.roles().findIndex(r => r.id === this.assignRoleId);
      if (idx !== -1) {
        const updatedRoles = [...this.roles()];
        updatedRoles[idx] = { ...updatedRoles[idx], permissionIds: [...ids] };
        this.roles.set(updatedRoles);
      }

      this.message.success('角色权限已保存');
      this.saving.set(false);
      this.backToList();
    }, 300);
  }
}
