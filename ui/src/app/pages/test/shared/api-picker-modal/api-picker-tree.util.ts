import { ApiResourceDTO } from '@services/system/api-resource.service';

import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';

export type ApiPickerAddedFilter = 'all' | 'added' | 'notAdded';

export type ApiPickerStatusFilter = 'active' | 'stale' | 'all';

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
export const API_FALLBACK_MODULE = '其他';

export function groupNodeKey(prefix: string): string {
  return `${GROUP_KEY_PREFIX}${prefix}`;
}

export function isGroupNodeKey(key: string): boolean {
  return key.startsWith(GROUP_KEY_PREFIX);
}

/** 与资源目录相同：优先用 module，空则取路径第一段 */
export function catalogModule(api: ApiResourceDTO): string {
  const moduleName = api.module?.trim();
  if (moduleName) {
    return moduleName;
  }
  return getRootSegment(api.path);
}

export function moduleLabel(moduleName: string): string {
  return moduleName === API_FALLBACK_MODULE ? '未归类' : moduleName;
}

function methodMatches(apiMethod: string, selected: string): boolean {
  const target = selected.trim().toUpperCase();
  return apiMethod.split('/').some(part => part.trim().toUpperCase() === target);
}

/** path 按 / 分割，取第一个非空段作为分组根（如 /api/users → api） */
export function getRootSegment(path: string): string {
  const segments = path.split('/');
  for (const segment of segments) {
    if (segment) {
      return segment;
    }
  }
  return API_FALLBACK_MODULE;
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

/** 按关键字 / 方法过滤 API。关键字含路径、描述、名称、模块；方法按 / 拆开匹配。 */
export function filterApis(apis: ApiResourceDTO[], keyword: string, method?: string): ApiResourceDTO[] {
  let list = [...apis];
  const kw = keyword.trim().toLowerCase();
  if (kw) {
    list = list.filter(api => {
      const moduleName = catalogModule(api).toLowerCase();
      return (
        api.path.toLowerCase().includes(kw) ||
        (api.description?.toLowerCase().includes(kw) ?? false) ||
        (api.name?.toLowerCase().includes(kw) ?? false) ||
        moduleName.includes(kw) ||
        moduleLabel(catalogModule(api)).toLowerCase().includes(kw) ||
        api.method.toLowerCase().includes(kw)
      );
    });
  }
  if (method) {
    list = list.filter(api => methodMatches(api.method, method));
  }
  return list;
}

/** 正常列表隐藏未关联的已失效接口；已关联的失效接口仍保留，避免保存时被悄悄去掉 */
export function filterApisByStatus(apis: ApiResourceDTO[], status: ApiPickerStatusFilter, linkedIds: number[]): ApiResourceDTO[] {
  if (status === 'all') {
    return [...apis];
  }
  if (status === 'stale') {
    return apis.filter(api => api.status === 'STALE');
  }
  const linked = new Set(linkedIds);
  return apis.filter(api => api.status !== 'STALE' || (api.id != null && linked.has(api.id)));
}

/** 按是否已加入当前资源组筛选 */
export function filterApisByAddedStatus(apis: ApiResourceDTO[], existingIds: number[], status: ApiPickerAddedFilter): ApiResourceDTO[] {
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
export function buildApiPickerTreeNodes(apis: ApiResourceDTO[], linkedIds: number[] = [], options?: ApiPickerTreeBuildOptions): ApiPickerTreeNodeOptions[] {
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
    const root = catalogModule(api);
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
      groupPrefix: root,
      segmentLabel: moduleLabel(root),
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
export function extractApiIdsFromCheckedKeys(keys: Array<string | number>): number[] {
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
