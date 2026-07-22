import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { CodeGenFieldDef, CodeGenRequest, CodeGenResult, CodeGenTarget } from '@app/pages/system/test/codegen/models/codegen.models';
import { CodeGenService } from '@app/pages/system/test/codegen/services/codegen.service';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

function defaultField(partial?: Partial<CodeGenFieldDef>): CodeGenFieldDef {
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

function moduleKebab(moduleName: string): string {
  return moduleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

@Component({
  selector: 'app-codegen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzButtonModule,
    NzWaveModule,
    NzCheckboxModule,
    NzIconModule,
    NzSelectModule,
    NzSwitchModule,
    NzTableModule,
    NzTabsModule,
    NzDividerModule,
    NzEmptyModule,
    NzTagModule,
    NzTooltipModule,
    NzRadioModule
  ],
  templateUrl: './codegen.component.html',
  styleUrl: './codegen.component.less'
})
export class CodegenComponent {
  private codegenService = inject(CodeGenService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  readonly pageHeader: Partial<PageHeaderType> = {
    title: '代码生成（测试）',
    desc: '根据字段定义预览后端 Java 或前端 Angular 源码，仅预览不写磁盘。'
  };

  typesResource = this.codegenService.getJavaTypesResource();

  javaTypeOptions = computed(() => {
    if (this.typesResource.hasValue()) {
      return this.typesResource.value().javaTypes;
    }
    return ['String', 'Integer', 'Long', 'Boolean', 'LocalDateTime', 'BigDecimal'];
  });

  targetOptions = computed(() => {
    if (this.typesResource.hasValue()) {
      return this.typesResource.value().targets;
    }
    return ['backend', 'frontend'] as CodeGenTarget[];
  });

  target = signal<CodeGenTarget>('backend');
  isBackend = computed(() => this.target() === 'backend');
  isFrontend = computed(() => this.target() === 'frontend');

  moduleName = 'Product';
  tableName = 'demo_product';
  apiPath = '/demo/generated/product';
  packageName = 'com.foticc.upms.demo.generated.product';
  moduleTitle = '产品管理（测试）';
  frontendBasePath = 'src/app/pages/system/test/product';
  enableAudit = true;

  fields = signal<CodeGenFieldDef[]>([
    defaultField({ name: 'title', javaType: 'String', nullable: false, required: true, searchable: true, comment: '标题' }),
    defaultField({ name: 'price', javaType: 'BigDecimal', nullable: false, required: true, comment: '价格' }),
    defaultField({ name: 'enabled', javaType: 'Boolean', comment: '是否启用' })
  ]);

  previewLoading = signal(false);
  previewResult = signal<CodeGenResult | null>(null);
  activeFileTab = 0;

  expectedFileCount = computed(() => (this.target() === 'frontend' ? 8 : 7));

  targetLabel(target: CodeGenTarget): string {
    return target === 'frontend' ? '前端 Angular' : '后端 Java';
  }

  onTargetChange(value: CodeGenTarget): void {
    this.target.set(value);
    this.previewResult.set(null);
    this.syncPathsByModuleName();
  }

  onModuleNameChange(): void {
    this.syncPathsByModuleName();
  }

  addField(): void {
    this.fields.update(list => [...list, defaultField()]);
  }

  removeField(index: number): void {
    this.fields.update(list => (list.length <= 1 ? list : list.filter((_, i) => i !== index)));
  }

  onJavaTypeChange(field: CodeGenFieldDef): void {
    if (field.javaType !== 'String' && field.searchable) {
      field.searchable = false;
    }
  }

  loadExample(): void {
    this.moduleName = 'Product';
    this.apiPath = '/demo/generated/product';
    this.enableAudit = true;
    this.fields.set([
      defaultField({ name: 'title', javaType: 'String', nullable: false, required: true, searchable: true, comment: '标题' }),
      defaultField({ name: 'price', javaType: 'BigDecimal', nullable: false, required: true, comment: '价格' }),
      defaultField({ name: 'enabled', javaType: 'Boolean', comment: '是否启用' })
    ]);
    if (this.isBackend()) {
      this.tableName = 'demo_product';
      this.packageName = 'com.foticc.upms.demo.generated.product';
    } else {
      this.moduleTitle = '产品管理（测试）';
    }
    this.syncPathsByModuleName();
    this.previewResult.set(null);
  }

  preview(): void {
    const module = this.moduleName?.trim();
    if (!module) {
      this.message.warning('请填写 moduleName');
      return;
    }
    const fieldList = this.fields().filter(f => f.name?.trim());
    if (!fieldList.length) {
      this.message.warning('请至少配置一个业务字段');
      return;
    }

    const body: CodeGenRequest = {
      target: this.target(),
      moduleName: module,
      enableAudit: this.enableAudit,
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

    if (this.apiPath?.trim()) {
      body.apiPath = this.apiPath.trim();
    }
    if (this.isBackend()) {
      if (this.tableName?.trim()) {
        body.tableName = this.tableName.trim();
      }
      if (this.packageName?.trim()) {
        body.packageName = this.packageName.trim();
      }
    } else {
      if (this.moduleTitle?.trim()) {
        body.moduleTitle = this.moduleTitle.trim();
      }
      if (this.frontendBasePath?.trim()) {
        body.frontendBasePath = this.frontendBasePath.trim();
      }
    }

    this.previewLoading.set(true);
    this.codegenService
      .preview(body)
      .pipe(
        finalize(() => this.previewLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: res => {
          this.previewResult.set(res);
          this.activeFileTab = 0;
        },
        error: (err: NzSafeAny) => {
          this.message.error(err?.msg || err?.error?.msg || '代码生成失败');
        }
      });
  }

  fileTabTitle(relativePath: string): string {
    const parts = relativePath.split('/');
    return parts[parts.length - 1] || relativePath;
  }

  copyContent(content: string): void {
    void navigator.clipboard.writeText(content).then(
      () => this.message.success('已复制到剪贴板'),
      () => this.message.error('复制失败')
    );
  }

  copyAllFiles(): void {
    const result = this.previewResult();
    if (!result?.files.length) {
      return;
    }
    const text = result.files.map(f => `// ${f.relativePath}\n${f.content}`).join('\n\n');
    this.copyContent(text);
  }

  private syncPathsByModuleName(): void {
    const module = this.moduleName?.trim();
    if (!module) {
      return;
    }
    const kebab = moduleKebab(module);
    const camel = module.charAt(0).toLowerCase() + module.slice(1);
    this.apiPath = `/demo/generated/${camel}`;
    if (this.isBackend()) {
      this.tableName = `demo_${kebab.replace(/-/g, '_')}`;
      this.packageName = `com.foticc.upms.demo.generated.${camel}`;
    } else {
      this.frontendBasePath = `src/app/pages/system/test/${kebab}`;
      this.moduleTitle = `${module}（测试）`;
    }
  }
}
