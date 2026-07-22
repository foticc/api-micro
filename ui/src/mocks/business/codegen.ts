import { http, HttpResponse } from 'msw';

const JAVA_TYPES = ['String', 'Integer', 'Long', 'Boolean', 'LocalDateTime', 'BigDecimal'];
const TARGETS = ['backend', 'frontend'];

interface CodeGenFieldDef {
  name: string;
  javaType: string;
  columnName?: string;
  nullable?: boolean;
  required?: boolean;
  searchable?: boolean;
  comment?: string;
}

interface CodeGenRequest {
  moduleName: string;
  target?: string;
  tableName?: string;
  apiPath?: string;
  packageName?: string;
  moduleTitle?: string;
  frontendBasePath?: string;
  enableAudit?: boolean;
  fields: CodeGenFieldDef[];
}

function toSnake(name: string): string {
  return name
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase();
}

function moduleCamel(moduleName: string): string {
  return moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
}

function moduleKebab(moduleName: string): string {
  return moduleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function normalizeTarget(raw?: string): 'backend' | 'frontend' {
  const t = raw?.trim().toLowerCase();
  if (t === 'frontend' || t === 'front') {
    return 'frontend';
  }
  return 'backend';
}

function javaToTs(javaType: string): string {
  switch (javaType) {
    case 'String':
    case 'LocalDateTime':
      return 'string';
    case 'Boolean':
      return 'boolean';
    case 'Integer':
    case 'Long':
    case 'BigDecimal':
      return 'number';
    default:
      return 'unknown';
  }
}

function validate(body: CodeGenRequest): string | null {
  if (!body.moduleName?.trim()) {
    return 'moduleName 不能为空';
  }
  if (!body.fields?.length) {
    return 'fields 不能为空';
  }
  const names = new Set<string>();
  for (const f of body.fields) {
    if (!f.name?.trim()) {
      return '字段 name 不能为空';
    }
    if (names.has(f.name)) {
      return `字段名重复: ${f.name}`;
    }
    names.add(f.name);
    if (!JAVA_TYPES.includes(f.javaType)) {
      return `不支持的字段类型: ${f.javaType}`;
    }
    if (f.searchable && f.javaType !== 'String') {
      return `仅 String 字段支持 searchable: ${f.name}`;
    }
  }
  return null;
}

function buildBackendResult(body: CodeGenRequest) {
  const module = body.moduleName.trim();
  const pkg = body.packageName ?? `com.foticc.upms.demo.generated.${moduleCamel(module)}`;
  const apiPath = body.apiPath ?? `/demo/generated/${moduleCamel(module)}`;
  const table = body.tableName ?? `demo_${toSnake(module)}`;
  const audit = body.enableAudit !== false;

  const fieldLines = body.fields
    .map(f => {
      const col = f.columnName ?? toSnake(f.name);
      return `    /** ${f.comment ?? f.name} */\n    private ${f.javaType} ${f.name}; // column: ${col}`;
    })
    .join('\n\n');

  const entity = `package ${pkg}.entity;

@Entity
@Table(name = "${table}")
public class ${module}Entity extends BaseEntity {

${fieldLines}
${audit ? '\n    // audit fields\n' : ''}
}
`;

  const base = pkg.replace(/\./g, '/');
  return {
    target: 'backend' as const,
    moduleName: module,
    outputPath: pkg,
    apiPath,
    files: [
      { relativePath: `src/main/java/${base}/entity/${module}Entity.java`, content: entity },
      {
        relativePath: `src/main/java/${base}/repos/${module}Repository.java`,
        content: `package ${pkg}.repos;\n\npublic interface ${module}Repository extends JpaRepository<${module}Entity, Long> {}\n`
      },
      {
        relativePath: `src/main/java/${base}/dto/${module}DTO.java`,
        content: `package ${pkg}.dto;\n\npublic class ${module}DTO {\n${body.fields.map(f => `    private ${f.javaType} ${f.name};`).join('\n')}\n}\n`
      },
      {
        relativePath: `src/main/java/${base}/${module}Convert.java`,
        content: `package ${pkg};\n\npublic class ${module}Convert {\n    // entity <-> dto\n}\n`
      },
      {
        relativePath: `src/main/java/${base}/${module}QueryParam.java`,
        content: `package ${pkg};\n\npublic record ${module}QueryParam(String keyword) {}\n`
      },
      {
        relativePath: `src/main/java/${base}/service/${module}Service.java`,
        content: `package ${pkg}.service;\n\n@Service\npublic class ${module}Service {\n    // CRUD + page\n}\n`
      },
      {
        relativePath: `src/main/java/${base}/controller/${module}Controller.java`,
        content: `package ${pkg}.controller;\n\n@RestController\n@RequestMapping("${apiPath}")\npublic class ${module}Controller {}\n`
      }
    ]
  };
}

function buildFrontendResult(body: CodeGenRequest) {
  const module = body.moduleName.trim();
  const kebab = moduleKebab(module);
  const apiPath = body.apiPath ?? `/demo/generated/${moduleCamel(module)}`;
  const basePath = body.frontendBasePath ?? `src/app/pages/system/test/${kebab}`;
  const title = body.moduleTitle ?? `${module}（测试）`;
  const audit = body.enableAudit !== false;
  const hasKeyword = body.fields.some(f => f.searchable && f.javaType === 'String');

  const voFields = body.fields.map(f => `  ${f.name}${f.nullable !== false ? '?' : ''}: ${javaToTs(f.javaType)};`).join('\n');
  const auditFields = audit ? `\n  createdAt?: string;\n  updatedAt?: string;\n  createdBy?: string;\n  lastModifiedBy?: string;` : '';
  const paramPick = body.fields.map(f => `'${f.name}'`).join(' | ');

  const models = `export interface ${module}VO {
  id?: number;
${voFields}${auditFields}
}

export type ${module}Param = Pick<${module}VO, ${paramPick}>;

export interface ${module}QueryParam {
${hasKeyword ? '  keyword?: string;\n' : ''}}`;

  const service = `@Service()
export class ${module}Service {
  getPageResource(...) { return this.http.postResource('${apiPath}/page', ...); }
  getDetail(id: number) { return this.http.get(\`${apiPath}/\${id}\`); }
  create(param: ${module}Param) { return this.http.post('${apiPath}', param); }
  update(id: number, param: ${module}Param) { return this.http.put(\`${apiPath}/\${id}\`, param); }
  delete(ids: number[]) { return this.http.post('${apiPath}/del', ids); }
}`;

  const routing = `{
  path: '${kebab}',
  title: '${title}',
  data: { key: 'rbac-test-${kebab}' },
  loadComponent: () => import('./${kebab}/${kebab}-list.component').then(m => m.${module}ListComponent)
}`;

  return {
    target: 'frontend' as const,
    moduleName: module,
    outputPath: basePath,
    apiPath,
    files: [
      { relativePath: `${basePath}/models/${kebab}.models.ts`, content: models },
      { relativePath: `${basePath}/services/${kebab}.service.ts`, content: service },
      { relativePath: `${basePath}/${kebab}-list.component.ts`, content: `export class ${module}ListComponent {}\n` },
      { relativePath: `${basePath}/${kebab}-list.component.html`, content: `<app-page-header />\n<!-- ${title} list -->\n` },
      { relativePath: `${basePath}/${kebab}-modal/${kebab}-modal.component.ts`, content: `export class ${module}ModalComponent {}\n` },
      { relativePath: `${basePath}/${kebab}-modal/${kebab}-modal.component.html`, content: `<form nz-form><!-- modal --></form>\n` },
      { relativePath: `${basePath}/services/${kebab}-modal.service.ts`, content: `export class ${module}ModalService {}\n` },
      { relativePath: `${basePath}/routing.entry.ts`, content: routing }
    ]
  };
}

export const codegen = [
  http.get('/site/api/demo/codegen/types', () => {
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: { javaTypes: JAVA_TYPES, targets: TARGETS } });
  }),

  http.post('/site/api/demo/codegen/preview', async ({ request }) => {
    const body = (await request.json()) as CodeGenRequest;
    const err = validate(body);
    if (err) {
      return HttpResponse.json({ code: 400, msg: err, data: null }, { status: 200 });
    }
    const target = normalizeTarget(body.target);
    const data = target === 'frontend' ? buildFrontendResult(body) : buildBackendResult(body);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data });
  })
];
