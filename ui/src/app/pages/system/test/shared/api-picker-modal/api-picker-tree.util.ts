import { ApiResourceDTO } from '@services/system/api-resource.service';

import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';

export type ApiPickerAddedFilter = 'all' | 'added' | 'notAdded';

export type ApiPickerSortBy = 'path' | 'method';

export interface ApiPickerTreeBuildOptions {
  /** 管理模式下已关联项可勾选/取消，仅展示标签不锁定 */
  manageMode?: boolean;
}

/** nz-tree 节点扩展字段（配合 nzTreeTemplate 的 let-origin） */
export interface ApiPickerTreeNodeOptions extends NzTreeNodeOptions {
  api?: ApiResourceDTO;
  isExisting?: boolean;
  isGroup?: boolean;
  groupPrefix?: string;
  segmentLabel?: string;
  selectableCount?: number;
  existingCount?: number;
}

const GROUP_KEY_PREFIX = 'group:';
const ROOT_FALLBACK = '其他';

export function groupNodeKey(prefix: string): string {
  return `${GROUP_KEY_PREFIX}${prefix}`;
}

export function isGroupNodeKey(key: string): boolean {
  return key.startsWith(GROUP_KEY_PREFIX);
}

/** path 按 / 分割，取第一个非空段作为分组根（如 /api/users → api） */
export function getRootSegment(path: string): string {
  const segments = path.split('/');
  for (const segment of segments) {
    if (segment) {
      return segment;
    }
  }
  return ROOT_FALLBACK;
}

function sortApis(apis: ApiResourceDTO[]): ApiResourceDTO[] {
  return [...apis].sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

function createApiLeaf(api: ApiResourceDTO, linkedSet: Set<number>, manageMode: boolean): ApiPickerTreeNodeOptions {
  const id = api.id!;
  const isLinked = linkedSet.has(id);
  const lockLinked = !manageMode && isLinked;
  return {
    title: `${api.method} ${api.path}`,
    key: String(id),
    isLeaf: true,
    disabled: lockLinked,
    disableCheckbox: lockLinked,
    isExisting: isLinked,
    api
  };
}

/** 按关键字 / 方法过滤 API */
export function filterApis(apis: ApiResourceDTO[], keyword: string, method?: string): ApiResourceDTO[] {
  let list = [...apis];
  const kw = keyword.trim().toLowerCase();
  if (kw) {
    list = list.filter(
      a =>
        a.path.toLowerCase().includes(kw) ||
        (a.description?.toLowerCase().includes(kw) ?? false) ||
        a.method.toLowerCase().includes(kw)
    );
  }
  if (method) {
    list = list.filter(a => a.method === method);
  }
  return list;
}

/** 按是否已加入当前资源组筛选 */
export function filterApisByAddedStatus(
  apis: ApiResourceDTO[],
  existingIds: number[],
  status: ApiPickerAddedFilter
): ApiResourceDTO[] {
  if (status === 'all') {
    return [...apis];
  }
  if (status === 'added' && existingIds.length === 0) {
    return [];
  }
  const existingSet = new Set(existingIds);
  return apis.filter(a => {
    if (a.id == null) {
      return false;
    }
    const isAdded = existingSet.has(a.id);
    return status === 'added' ? isAdded : !isAdded;
  });
}

/** 将 API 列表按 path 首段（/ 分割后第一个非空字符串）分组构建树 */
export function buildApiPickerTreeNodes(
  apis: ApiResourceDTO[],
  linkedIds: number[] = [],
  options?: ApiPickerTreeBuildOptions
): ApiPickerTreeNodeOptions[] {
  if (!apis.length) {
    return [];
  }

  const manageMode = options?.manageMode ?? false;
  const linkedSet = new Set(linkedIds);
  const groupMap = new Map<string, ApiResourceDTO[]>();

  for (const api of apis) {
    if (api.id == null) {
      continue;
    }
    const root = getRootSegment(api.path);
    const bucket = groupMap.get(root) ?? [];
    bucket.push(api);
    groupMap.set(root, bucket);
  }

  const sortedRoots = [...groupMap.keys()].sort((a, b) => a.localeCompare(b));
  const nodes: ApiPickerTreeNodeOptions[] = [];

  for (const root of sortedRoots) {
    const items = sortApis(groupMap.get(root) ?? []);
    const children = items.map(api => createApiLeaf(api, linkedSet, manageMode));
    const linkedCount = children.filter(c => c.isExisting).length;
    const selectableCount = manageMode ? children.length : children.filter(c => !c.disableCheckbox).length;

    nodes.push({
      title: root,
      key: groupNodeKey(root),
      isLeaf: false,
      isGroup: true,
      groupPrefix: `/${root}`,
      segmentLabel: root,
      selectableCount,
      existingCount: linkedCount,
      disableCheckbox: !manageMode && selectableCount === 0,
      disabled: !manageMode && selectableCount === 0,
      children
    });
  }

  return nodes;
}

/** 从树勾选 key 中提取 API id（忽略分组节点 key） */
export function extractApiIdsFromCheckedKeys(keys: (string | number)[]): number[] {
  const ids: number[] = [];
  for (const key of keys) {
    const str = String(key);
    if (isGroupNodeKey(str)) {
      continue;
    }
    const id = Number(str);
    if (!Number.isNaN(id)) {
      ids.push(id);
    }
  }
  return ids;
}

export function sortSelectedApis(list: ApiResourceDTO[], sortBy: ApiPickerSortBy): ApiResourceDTO[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    if (sortBy === 'method') {
      return a.method.localeCompare(b.method) || a.path.localeCompare(b.path);
    }
    return a.path.localeCompare(b.path) || a.method.localeCompare(b.method);
  });
  return sorted;
}
