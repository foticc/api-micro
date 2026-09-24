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
