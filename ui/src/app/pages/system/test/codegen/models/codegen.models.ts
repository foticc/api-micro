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
  target?: CodeGenTarget | 'back' | 'front';
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
