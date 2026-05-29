import { Menu } from '@core/services/types';
import { fnAddTreeDataGradeAndLeaf, fnFlatDataHasParentToTree } from '@utils/treeTableTools';

import { PermissionMenu } from '../models/rbac.models';

import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';

/** nz-tree 节点扩展字段（配合 nzTreeTemplate 的 let-origin） */
export interface MenuPickerTreeNodeOptions extends NzTreeNodeOptions {
  menu: Menu;
  isExisting: boolean;
  /** iconfont，icon 为空时使用 */
  iconfont?: string;
}

/** 构建树前剥离 children/level 等字段，避免重复搜索时在同一对象上叠树导致节点翻倍 */
function cloneFlatMenusForTreeBuild(flatMenus: Menu[]): Menu[] {
  return flatMenus.map(m => {
    const { children, open, selected, level, ...rest } = m as Menu & {
      children?: Menu[];
      open?: boolean;
      selected?: boolean;
      level?: number;
    };
    return { ...rest } as Menu;
  });
}

/** 将扁平菜单转为 nz-tree 勾选节点（菜单选择弹窗） */
export function buildMenuPickerTreeNodes(flatMenus: Menu[], existingIds: number[] = []): MenuPickerTreeNodeOptions[] {
  if (!flatMenus.length) {
    return [];
  }
  const existingSet = new Set(existingIds);
  const tree = fnAddTreeDataGradeAndLeaf(fnFlatDataHasParentToTree(cloneFlatMenusForTreeBuild(flatMenus))) as Menu[];
  return mapMenuNodesToPickerTree(tree, existingSet);
}

function mapMenuNodesToPickerTree(nodes: Menu[], existingSet: Set<number>): MenuPickerTreeNodeOptions[] {
  return nodes.map(node => {
    const id = Number(node.id);
    const key = String(id);
    const isExisting = existingSet.has(id);
    const children = node.children?.length ? mapMenuNodesToPickerTree(node.children, existingSet) : undefined;
    const isLeaf = !children?.length;
    const displayIcon = resolveMenuDisplayIcon(node);
    const antIcon = displayIcon?.kind === 'antd' ? displayIcon.value : undefined;
    const iconfont = displayIcon?.kind === 'iconfont' ? displayIcon.value : undefined;

    return {
      title: formatMenuNodeTitle(node),
      key,
      isLeaf,
      /** NzTreeNodeOptions.icon：与 nzShowIcon 配合；自定义模板下用于 antd 图标 */
      icon: antIcon,
      disabled: node.status === false || isExisting,
      disableCheckbox: isExisting,
      children,
      isExisting,
      menu: node,
      iconfont
    };
  });
}

/** 菜单选择弹窗：按是否已加入当前资源组筛选 */
export type MenuPickerAddedFilter = 'all' | 'added' | 'notAdded';

/** 按已添加 / 未添加筛选（保留匹配节点的祖先以维持树形结构） */
export function filterFlatMenusByAddedStatus(
  flatMenus: Menu[],
  existingIds: number[],
  status: MenuPickerAddedFilter
): Menu[] {
  if (status === 'all') {
    return [...flatMenus];
  }
  if (status === 'added' && existingIds.length === 0) {
    return [];
  }

  const existingSet = new Set(existingIds);
  const byId = new Map(flatMenus.map(m => [Number(m.id), m]));
  const matchedIds = new Set<number>();

  for (const m of flatMenus) {
    const id = Number(m.id);
    const isAdded = existingSet.has(id);
    const hit = status === 'added' ? isAdded : !isAdded;
    if (!hit) {
      continue;
    }
    let current: Menu | undefined = m;
    while (current) {
      matchedIds.add(Number(current.id));
      const parentId: number = Number(current.fatherId);
      current = parentId === 0 ? undefined : byId.get(parentId);
    }
  }

  return flatMenus.filter(m => matchedIds.has(Number(m.id)));
}

/** 按菜单名 / 权限码过滤扁平列表 */
export function filterFlatMenus(flatMenus: Menu[], keyword: string): Menu[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) {
    return [...flatMenus];
  }
  const matchedIds = new Set<number>();
  const byId = new Map(flatMenus.map(m => [Number(m.id), m]));

  for (const m of flatMenus) {
    if (m.menuName.toLowerCase().includes(kw) || m.code.toLowerCase().includes(kw)) {
      let current: Menu | undefined = m;
      while (current) {
        matchedIds.add(Number(current.id));
        const parentId: number = Number(current.fatherId);
        current = parentId === 0 ? undefined : byId.get(parentId);
      }
    }
  }

  return flatMenus.filter(m => matchedIds.has(Number(m.id)));
}

function formatMenuNodeTitle(node: Menu): string {
  const typeLabel = node.menuType === 'F' ? '按钮' : '菜单';
  return `${node.menuName}（${typeLabel}）`;
}

export type MenuDisplayIcon = { kind: 'antd'; value: string } | { kind: 'iconfont'; value: string };

/** 菜单图标：优先 icon（Ant Design），否则 alIcon（iconfont） */
export function resolveMenuDisplayIcon(menu: Menu): MenuDisplayIcon | null {
  const icon = menu.icon?.trim();
  if (icon) {
    return { kind: 'antd', value: icon };
  }
  const alIcon = menu.alIcon?.trim();
  if (alIcon) {
    return { kind: 'iconfont', value: alIcon };
  }
  return null;
}

/** 为每个 menuId 补齐祖先 ID（去重；同一链路上先子后父） */
export function expandMenuIdsWithAncestors(menuIds: number[], flatMenus: Menu[]): number[] {
  const byId = new Map(flatMenus.map(m => [Number(m.id), m]));
  const ordered: number[] = [];
  const seen = new Set<number>();

  for (const startId of menuIds) {
    let current = byId.get(startId);
    const chain: number[] = [];
    while (current) {
      chain.push(Number(current.id));
      const parentId = Number(current.fatherId);
      current = parentId === 0 ? undefined : byId.get(parentId);
    }
    for (const id of chain) {
      if (!seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
  }

  return ordered;
}

/** 根据已选 menuId 解析展示用菜单快照 */
export function resolvePermissionMenus(menuIds: number[], flatMenus: Menu[]): PermissionMenu[] {
  const idSet = new Set(menuIds);
  const order = new Map(menuIds.map((id, index) => [id, index]));
  return flatMenus
    .filter(m => idSet.has(Number(m.id)))
    .sort((a, b) => (order.get(Number(a.id)) ?? 0) - (order.get(Number(b.id)) ?? 0))
    .map(m => ({
      id: Number(m.id),
      code: m.code,
      name: m.menuName,
      type: m.menuType === 'F' ? 'button' : 'menu'
    }));
}

/** 将详情接口 menus 规范为展示结构（兼容 menuName / menuType 字段） */
export function normalizePermissionMenu(item: Partial<PermissionMenu> & Record<string, unknown>): PermissionMenu {
  const menuType = item.type ?? item['menuType'];
  const type: PermissionMenu['type'] =
    menuType === 'button' || menuType === 'F' ? 'button' : 'menu';

  return {
    id: item.id ?? item['id'] ?? '',
    code: String(item.code ?? item['code'] ?? ''),
    name: String(item.name ?? item['menuName'] ?? ''),
    type
  };
}

export function normalizePermissionMenus(menus?: Array<Partial<PermissionMenu> & Record<string, unknown>>): PermissionMenu[] {
  if (!menus?.length) {
    return [];
  }
  return menus.map(normalizePermissionMenu);
}

export function extractPermissionMenuIds(permission: { menuIds?: number[]; menus?: Array<Partial<PermissionMenu> & Record<string, unknown>> }): number[] {
  if (permission.menuIds?.length) {
    return permission.menuIds.map(id => Number(id)).filter(id => !Number.isNaN(id));
  }
  return normalizePermissionMenus(permission.menus)
    .map(m => Number(m.id))
    .filter(id => !Number.isNaN(id));
}
