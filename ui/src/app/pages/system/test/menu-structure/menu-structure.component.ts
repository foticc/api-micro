import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';
import { RbacPermission } from '../models/rbac.models';
import { mockPermissions } from '../models/rbac.mock';
import { RbacNavComponent } from '../shared/rbac-nav.component';

import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTreeModule } from 'ng-zorro-antd/tree';

interface TreeNode {
  key: string;
  title: string;
  type: 'module' | 'permission' | 'menu' | 'api' | 'button';
  children?: TreeNode[];
}

@Component({
  selector: 'app-menu-structure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, RbacNavComponent, NzCardModule, NzTreeModule, NzButtonModule, NzWaveModule, NzIconModule, NzAlertModule, NzEmptyModule],
  templateUrl: './menu-structure.component.html',
  styles: `
    .structure-scroll {
      max-height: calc(100vh - 340px);
      overflow: auto;
    }
    .tree-meta {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
      margin-left: 8px;
    }
    .module-tag {
      background: #e6f7ff;
      color: #1890ff;
    }
    .permission-tag {
      background: #f6ffed;
      color: #52c41a;
    }
    .menu-tag {
      background: #fff7e6;
      color: #fa8c16;
    }
    .api-tag {
      background: #f9f0ff;
      color: #722ed1;
    }
  `
})
export class MenuStructureComponent implements OnInit {
  private router = inject(Router);

  loading = signal(false);
  tree = signal<TreeNode[]>([]);
  expandedKeys = signal<string[]>([]);

  readonly pageHeaderInfo: Partial<PageHeaderType> = {
    title: '资源结构',
    desc: '只读展示：模块 → 权限资源组 → 菜单/API 的层级关系。写操作请前往「权限资源组」。'
  };

  load(): void {
    this.loading.set(true);

    setTimeout(() => {
      const permissions = [...mockPermissions];
      const tree = this.buildTree(permissions);
      this.tree.set(tree);

      const keys: string[] = [];
      const walk = (nodes: TreeNode[]) => {
        for (const n of nodes) {
          keys.push(n.key);
          if (n.children) {
            walk(n.children);
          }
        }
      };
      walk(tree);
      this.expandedKeys.set(keys);

      this.loading.set(false);
    }, 300);
  }

  private buildTree(permissions: RbacPermission[]): TreeNode[] {
    const modules: { [key: string]: TreeNode } = {};

    return permissions.map(p => {
      const permissionNode: TreeNode = {
        key: `perm:${p.id}`,
        title: `${p.name} [${p.code}]`,
        type: 'permission',
        children: []
      };

      if (p.menus && p.menus.length > 0) {
        p.menus.forEach(menu => {
          permissionNode.children!.push({
            key: `menu:${menu.id}`,
            title: `${menu.name} (${menu.type === 'menu' ? '菜单' : '按钮'})`,
            type: menu.type === 'menu' ? 'menu' : 'button'
          });
        });
      }

      if (p.apis && p.apis.length > 0) {
        p.apis.forEach(api => {
          permissionNode.children!.push({
            key: `api:${p.id}:${api.path}`,
            title: `${api.method} ${api.path}`,
            type: 'api'
          });
        });
      }

      return permissionNode;
    });
  }

  goDefine(): void {
    this.router.navigate(['/default/system/test/permissions']);
  }

  expandAll(): void {
    const keys: string[] = [];
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        keys.push(n.key);
        if (n.children) {
          walk(n.children);
        }
      }
    };
    walk(this.tree());
    this.expandedKeys.set(keys);
  }

  collapseAll(): void {
    this.expandedKeys.set([]);
  }

  ngOnInit(): void {
    this.load();
  }
}
