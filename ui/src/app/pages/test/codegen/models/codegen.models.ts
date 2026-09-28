import { PageInfo, SearchCommonVO } from '@core/services/types';

/** 与后端 CodeGenFieldDef 对齐 */
export interface CodeGenFieldDef {
  name: string;
  javaType: string;
  columnName?: string;
  nullable?: boolean;
  required?: boolean;
  searchable?: boolean;
  comment?: string;
}

export type CodeGenTarget = 'backend' | 'frontend';

/** 与后端 CodeGenRequest 对齐 */
export interface CodeGenRequest {
  moduleName: string;
  target?: CodeGenTarget;
  fields: CodeGenFieldDef[];
  tableName?: string;
  apiPath?: string;
  packageName?: string;
  moduleTitle?: string;
  frontendBasePath?: string;
  enableAudit?: boolean;
}

/** GET /demo/codegen/types */
export interface CodeGenTypesResponse {
  javaTypes: string[];
  targets: CodeGenTarget[];
}

/** 与后端 CodeGenFile 对齐 */
export interface CodeGenFile {
  relativePath: string;
  content: string;
}

/** 与后端 CodeGenResult 对齐 */
export interface CodeGenResult {
  target: CodeGenTarget;
  moduleName: string;
  outputPath: string;
  apiPath: string;
  files: CodeGenFile[];
}

/** 新建 / 更新方案请求体 */
export interface CodeGenSchemaSaveRequest {
  name: string;
  remark?: string;
  request: CodeGenRequest;
}

/** 方案列表项（不含 request） */
export interface CodeGenSchemaListVO {
  id: number;
  name: string;
  remark?: string;
  moduleName: string;
  target: CodeGenTarget;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

/** 方案详情（含 request，用于回填表单） */
export interface CodeGenSchemaDetailVO extends CodeGenSchemaListVO {
  request: CodeGenRequest;
}

/** 方案分页筛选 */
export interface CodeGenSchemaQueryParam {
  keyword?: string;
}

export type CodeGenSchemaPageParam = SearchCommonVO<CodeGenSchemaQueryParam>;
export type CodeGenSchemaPageResult = PageInfo<CodeGenSchemaListVO>;
