/** 与后端 PropertyLatestDTO 对齐 */
export interface PropertyLatest {
  identifier: string;
  name: string;
  value: unknown;
  time?: string;
}

/** 与后端 PropertyHistoryDTO 对齐 */
export interface PropertyHistory {
  identifier: string;
  name: string;
  points: PropertyPoint[];
}

export interface PropertyPoint {
  time?: string;
  value: unknown;
}

/** 与后端 PropertySeriesPageDTO 对齐 */
export interface PropertySeriesQuery {
  deviceId?: number;
  start?: string;
  end?: string;
}

export interface PropertySeriesColumn {
  identifier: string;
  name: string;
}

export interface PropertySeriesRow {
  time?: string;
  values?: Record<string, unknown>;
}

export interface PropertySeriesPage {
  pageIndex: number;
  pageSize: number;
  total: number;
  columns?: PropertySeriesColumn[];
  list: PropertySeriesRow[];
}
