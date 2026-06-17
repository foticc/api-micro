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

export interface MenuPickerTreeBuildOptions {
  /** 管理模式下已关联项可勾选/取消，仅展示标签不锁定 */
  manageMode?: boolean;
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
export function buildMenuPickerTreeNodes(
  flatMenus: Menu[],
  linkedIds: number[] = [],
  options?: MenuPickerTreeBuildOptions
): MenuPickerTreeNodeOptions[] {
  if (!flatMenus.length) {
    return [];
  }
  const linkedSet = new Set(linkedIds);
  const manageMode = options?.manageMode ?? false;
  const tree = fnAddTreeDataGradeAndLeaf(fnFlatDataHasParentToTree(cloneFlatMenusForTreeBuild(flatMenus))) as Menu[];
  return mapMenuNodesToPickerTree(tree, linkedSet, manageMode);
}

/** 编辑页「关联菜单」预览树（只读，保留层级） */
export function buildLinkedMenuPreviewTree(flatMenus: Menu[], linkedIds: number[]): MenuPickerTreeNodeOptions[] {
  if (!linkedIds.length || !flatMenus.length) {
    return [];
  }
  const filtered = filterFlatMenusByAddedStatus(flatMenus, linkedIds, 'added');
  return buildMenuPickerTreeNodes(filtered, linkedIds, { manageMode: true });
}

function mapMenuNodesToPickerTree(
  nodes: Menu[],
  linkedSet: Set<number>,
  manageMode: boolean
): MenuPickerTreeNodeOptions[] {
  return nodes.map(node => {
    const id = Number(node.id);
    const key = String(id);
    const isLinked = linkedSet.has(id);
    const children = node.children?.length ? mapMenuNodesToPickerTree(node.children, linkedSet, manageMode) : undefined;
    const isLeaf = !children?.length;
    const displayIcon = resolveMenuDisplayIcon(node);
    const antIcon = displayIcon?.kind === 'antd' ? displayIcon.value : undefined;
    const iconfont = displayIcon?.kind === 'iconfont' ? displayIcon.value : undefined;
    const lockLinked = !manageMode && isLinked;

    return {
      title: formatMenuNodeTitle(node),
      key,
      isLeaf,
      /** NzTreeNodeOptions.icon：与 nzShowIcon 配合；自定义模板下用于 antd 图标 */
      icon: antIcon,
      disabled: node.status === false || lockLinked,
      disableCheckbox: lockLinked,
      children,
      isExisting: isLinked,
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

function buildMenuChildrenMap(flatMenus: Menu[]): Map<number, number[]> {
  const childrenMap = new Map<number, number[]>();
  for (const menu of flatMenus) {
    const parentId = Number(menu.fatherId);
    if (parentId === 0) {
      continue;
    }
    const children = childrenMap.get(parentId) ?? [];
    children.push(Number(menu.id));
    childrenMap.set(parentId, children);
  }
  return childrenMap;
}

/** 收集节点及其全部子孙 id */
export function collectDescendantIds(rootIds: number[], flatMenus: Menu[]): number[] {
  const childrenMap = buildMenuChildrenMap(flatMenus);
  const result = new Set<number>();
  const stack = rootIds.map(Number).filter(id => !Number.isNaN(id));

  while (stack.length) {
    const id = stack.pop()!;
    if (result.has(id)) {
      continue;
    }
    result.add(id);
    for (const child of childrenMap.get(id) ?? []) {
      stack.push(child);
    }
  }

  return [...result];
}

/**
 * nzCheckStrictly 下补父子联动：勾选/取消父节点级联子孙，但不误选兄弟节点。
 * @see https://ng.ant.design/components/tree/en#nzcheckstrictly
 */
export function applyMenuTreeCheckChange(
  previousExplicitIds: number[],
  nextExplicitIds: number[],
  flatMenus: Menu[]
): number[] {
  const previous = new Set(previousExplicitIds);
  const next = new Set(nextExplicitIds);

  for (const id of previous) {
    if (!next.has(id)) {
      for (const descId of collectDescendantIds([id], flatMenus)) {
        next.delete(descId);
      }
    }
  }

  for (const id of [...next]) {
    if (!previous.has(id)) {
      for (const descId of collectDescendantIds([id], flatMenus)) {
        next.add(descId);
      }
    }
  }

  return [...next];
}

function hasCheckedDescendant(id: number, checkedSet: Set<number>, childrenMap: Map<number, number[]>): boolean {
  for (const childId of childrenMap.get(id) ?? []) {
    if (checkedSet.has(childId)) {
      return true;
    }
    if (hasCheckedDescendant(childId, checkedSet, childrenMap)) {
      return true;
    }
  }
  return false;
}

/** 树上展示用勾选 key：在用户勾选的节点基础上补齐全部祖先 */
export function getMenuTreeDisplayCheckedKeys(explicitCheckedIds: number[], flatMenus: Menu[]): number[] {
  return expandMenuIdsWithAncestors(explicitCheckedIds, flatMenus);
}

/** 从含祖先的 menuIds 中提取应在树上展示为勾选的「最深层」节点（避免父子联动误选兄弟） */
export function getExplicitCheckedIds(menuIds: number[], flatMenus: Menu[]): number[] {
  const idSet = new Set(menuIds);
  const childrenMap = buildMenuChildrenMap(flatMenus);

  return menuIds.filter(id => {
    const children = childrenMap.get(id) ?? [];
    return !children.some(childId => idSet.has(childId));
  });
}

/** 根据树勾选结果 reconciled：补祖先，并移除无已选子孙的孤儿祖先 */
export function reconcileMenuSelectionFromTreeChecked(checkedMenuIds: number[], flatMenus: Menu[]): number[] {
  const checkedSet = new Set(checkedMenuIds);
  const expanded = expandMenuIdsWithAncestors(checkedMenuIds, flatMenus);
  const childrenMap = buildMenuChildrenMap(flatMenus);

  return expanded.filter(id => {
    if (checkedSet.has(id)) {
      return true;
    }
    return hasCheckedDescendant(id, checkedSet, childrenMap);
  });
}

/** 从当前关联中移除指定菜单（含子孙），并清理无已选子孙的祖先 */
export function removeMenusFromSelection(idsToRemove: number[], currentIds: number[], flatMenus: Menu[]): number[] {
  const removeSet = new Set(collectDescendantIds(idsToRemove, flatMenus));
  let remaining = currentIds.filter(id => !removeSet.has(id));
  remaining = pruneOrphanAncestorsFromSelection(remaining, flatMenus);
  return remaining;
}

export function pruneOrphanAncestorsFromSelection(menuIds: number[], flatMenus: Menu[]): number[] {
  const idSet = new Set(menuIds);
  const childrenMap = buildMenuChildrenMap(flatMenus);

  const hasDescendantInSet = (id: number): boolean => {
    for (const childId of childrenMap.get(id) ?? []) {
      if (idSet.has(childId)) {
        return true;
      }
      if (hasDescendantInSet(childId)) {
        return true;
      }
    }
    return false;
  };

  return menuIds.filter(id => {
    const children = childrenMap.get(id) ?? [];
    if (children.length === 0) {
      return true;
    }
    return hasDescendantInSet(id);
  });
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
