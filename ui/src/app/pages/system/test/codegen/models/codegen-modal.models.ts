import { CodeGenSchemaDetailVO, CodeGenTarget } from '../models/codegen.models';

export interface SchemaFormModalData {
  mode: 'create' | 'edit';
  /** 编辑时传入 */
  schemaId?: number;
  /** 编辑时可预取详情；不传则弹窗内自行加载 */
  detail?: CodeGenSchemaDetailVO;
}

export interface SchemaPreviewModalData {
  schemaId: number;
  /** 默认预览目标，不传则用方案内 target */
  defaultTarget?: CodeGenTarget;
  name?: string;
}
