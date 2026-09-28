/** 与后端 AuditDemoEntity / AuditDemoVO 对齐 */
export interface AuditDemoVO {
  id?: number;
  title: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

/** 与后端 AuditDemoParam 对齐（创建/更新请求体） */
export type AuditDemoParam = Pick<AuditDemoVO, 'title' | 'content'>;

/** 与后端 AuditDemoQueryParam 对齐（分页筛选） */
export interface AuditDemoQueryParam {
  keyword?: string;
}
