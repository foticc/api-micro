/** POST /rbac/api/sync — 返回本次同步写入条数 */

/** 接口 data 字段：同步数量（部分后端可能包在对象里） */
export type ApiSyncResponseData = number | { count?: number; syncCount?: number; created?: number };

export interface ApiSyncRunResult {
  created: number;
}
