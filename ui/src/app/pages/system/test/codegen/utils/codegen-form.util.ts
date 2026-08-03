import { NzMessageService } from 'ng-zorro-antd/message';

import { CodeGenFieldDef, CodeGenRequest, CodeGenSchemaDetailVO, CodeGenTarget } from '../models/codegen.models';

export interface CodegenFormModel {
  schemaName: string;
  schemaRemark: string;
  target: CodeGenTarget;
  moduleName: string;
  tableName: string;
  apiPath: string;
  packageName: string;
  moduleTitle: string;
  frontendBasePath: string;
  enableAudit: boolean;
  fields: CodeGenFieldDef[];
}

export function defaultField(partial?: Partial<CodeGenFieldDef>): CodeGenFieldDef {
  return {
    name: '',
    javaType: 'String',
    nullable: true,
    required: false,
    searchable: false,
    comment: '',
    ...partial
  };
}

export function moduleKebab(moduleName: string): string {
  return moduleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function createExampleFormModel(target: CodeGenTarget = 'backend'): CodegenFormModel {
  const model: CodegenFormModel = {
    schemaName: '',
    schemaRemark: '',
    target,
    moduleName: 'Product',
    tableName: 'demo_product',
    apiPath: '/demo/generated/product',
    packageName: 'com.foticc.upms.demo.generated.product',
    moduleTitle: '产品管理（测试）',
    frontendBasePath: 'src/app/pages/system/test/product',
    enableAudit: true,
    fields: [
      defaultField({ name: 'title', javaType: 'String', nullable: false, required: true, searchable: true, comment: '标题' }),
      defaultField({ name: 'price', javaType: 'BigDecimal', nullable: false, required: true, comment: '价格' }),
      defaultField({ name: 'enabled', javaType: 'Boolean', comment: '是否启用' })
    ]
  };
  syncPathsByModuleName(model);
  return model;
}

export function formModelFromDetail(detail: CodeGenSchemaDetailVO): CodegenFormModel {
  const req = detail.request;
  const target: CodeGenTarget = req.target === 'frontend' ? 'frontend' : 'backend';
  return {
    schemaName: detail.name,
    schemaRemark: detail.remark ?? '',
    target,
    moduleName: req.moduleName,
    tableName: req.tableName ?? '',
    apiPath: req.apiPath ?? '',
    packageName: req.packageName ?? '',
    moduleTitle: req.moduleTitle ?? '',
    frontendBasePath: req.frontendBasePath ?? '',
    enableAudit: req.enableAudit ?? true,
    fields: (req.fields?.length ? req.fields : [defaultField()]).map(f =>
      defaultField({
        name: f.name,
        javaType: f.javaType,
        columnName: f.columnName,
        nullable: f.nullable ?? true,
        required: f.required ?? false,
        searchable: f.searchable ?? false,
        comment: f.comment ?? ''
      })
    )
  };
}

export function syncPathsByModuleName(model: CodegenFormModel): void {
  const module = model.moduleName?.trim();
  if (!module) {
    return;
  }
  const kebab = moduleKebab(module);
  const camel = module.charAt(0).toLowerCase() + module.slice(1);
  model.apiPath = `/demo/generated/${camel}`;
  if (model.target === 'backend') {
    model.tableName = `demo_${kebab.replace(/-/g, '_')}`;
    model.packageName = `com.foticc.upms.demo.generated.${camel}`;
  } else {
    model.frontendBasePath = `src/app/pages/system/test/${kebab}`;
    model.moduleTitle = `${module}（测试）`;
  }
}

export function buildCodeGenRequest(model: CodegenFormModel, message: NzMessageService, targetOverride?: CodeGenTarget): CodeGenRequest | null {
  const module = model.moduleName?.trim();
  if (!module) {
    message.warning('请填写 moduleName');
    return null;
  }
  const fieldList = model.fields.filter(f => f.name?.trim());
  if (!fieldList.length) {
    message.warning('请至少配置一个业务字段');
    return null;
  }

  const target = targetOverride ?? model.target;
  const body: CodeGenRequest = {
    target,
    moduleName: module,
    enableAudit: model.enableAudit,
    fields: fieldList.map(f => ({
      name: f.name.trim(),
      javaType: f.javaType,
      ...(f.columnName?.trim() ? { columnName: f.columnName.trim() } : {}),
      nullable: f.nullable ?? true,
      required: f.required ?? false,
      searchable: f.javaType === 'String' ? (f.searchable ?? false) : false,
      ...(f.comment?.trim() ? { comment: f.comment.trim() } : {})
    }))
  };

  if (model.apiPath?.trim()) {
    body.apiPath = model.apiPath.trim();
  }
  if (target === 'backend') {
    if (model.tableName?.trim()) {
      body.tableName = model.tableName.trim();
    }
    if (model.packageName?.trim()) {
      body.packageName = model.packageName.trim();
    }
  } else {
    if (model.moduleTitle?.trim()) {
      body.moduleTitle = model.moduleTitle.trim();
    }
    if (model.frontendBasePath?.trim()) {
      body.frontendBasePath = model.frontendBasePath.trim();
    }
  }
  return body;
}

export function targetLabel(target: CodeGenTarget): string {
  return target === 'frontend' ? '前端 Angular' : '后端 Java';
}

export function fileTabTitle(relativePath: string): string {
  const parts = relativePath.split('/');
  return parts[parts.length - 1] || relativePath;
}
