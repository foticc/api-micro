/** 与后端 ProductVO 对齐 */
export interface ProductVO {
  id?: number;
  title: string;
  price: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

/** 与后端 ProductParam 对齐（创建/更新请求体） */
export type ProductParam = Pick<
  ProductVO,
  'title' | 
  'price' | 
  'enabled'
>;

/** 与后端 ProductQueryParam 对齐（分页筛选） */
export interface ProductQueryParam {
  enabled?: boolean;
}
