import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { SchemaFormModalData } from '@app/pages/system/test/codegen/models/codegen-modal.models';
import { CodeGenFieldDef, CodeGenResult, CodeGenTarget } from '@app/pages/system/test/codegen/models/codegen.models';
import { CodeGenService } from '@app/pages/system/test/codegen/services/codegen.service';
import {
  buildCodeGenRequest,
  CodegenFormModel,
  createExampleFormModel,
  defaultField,
  fileTabTitle,
  formModelFromDetail,
  syncPathsByModuleName,
  targetLabel
} from '@app/pages/system/test/codegen/utils/codegen-form.util';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-schema-form-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzButtonModule,
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
    NzRadioModule,
    NzSpinModule
  ],
  templateUrl: './schema-form-modal.component.html',
  styleUrl: './schema-form-modal.component.less'
})
export class SchemaFormModalComponent implements OnInit {
  private codegenService = inject(CodeGenService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);
  private modalRef = inject(NzModalRef);
  readonly data: SchemaFormModalData = inject(NZ_MODAL_DATA);

  loading = signal(false);
  saving = signal(false);
  previewLoading = signal(false);
  previewResult = signal<CodeGenResult | null>(null);
  activeFileTab = 0;
  showPreview = signal(false);

  form = signal<CodegenFormModel>(createExampleFormModel());

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

  isEdit = computed(() => this.data.mode === 'edit');
  isBackend = computed(() => this.form().target === 'backend');
  isFrontend = computed(() => this.form().target === 'frontend');

  targetLabel = targetLabel;
  fileTabTitle = fileTabTitle;

  ngOnInit(): void {
    if (this.data.mode === 'edit') {
      if (this.data.detail) {
        this.form.set(formModelFromDetail(this.data.detail));
      } else if (this.data.schemaId != null) {
        this.loadDetail(this.data.schemaId);
      }
    }
  }

  onTargetChange(value: CodeGenTarget): void {
    this.form.update(m => {
      const next = { ...m, target: value };
      syncPathsByModuleName(next);
      return next;
    });
    this.previewResult.set(null);
  }

  onModuleNameChange(value: string): void {
    this.form.update(m => {
      const next = { ...m, moduleName: value };
      syncPathsByModuleName(next);
      return next;
    });
  }

  patchForm(partial: Partial<CodegenFormModel>): void {
    this.form.update(m => ({ ...m, ...partial }));
  }

  addField(): void {
    this.form.update(m => ({ ...m, fields: [...m.fields, defaultField()] }));
  }

  removeField(index: number): void {
    this.form.update(m => ({
      ...m,
      fields: m.fields.length <= 1 ? m.fields : m.fields.filter((_, i) => i !== index)
    }));
  }

  onJavaTypeChange(field: CodeGenFieldDef): void {
    if (field.javaType !== 'String' && field.searchable) {
      field.searchable = false;
    }
  }

  loadExample(): void {
    const name = this.form().schemaName;
    const remark = this.form().schemaRemark;
    const target = this.form().target;
    const model = createExampleFormModel(target);
    model.schemaName = name;
    model.schemaRemark = remark;
    this.form.set(model);
    this.previewResult.set(null);
  }

  preview(): void {
    const body = buildCodeGenRequest(this.form(), this.message);
    if (!body) {
      return;
    }
    this.previewLoading.set(true);
    this.showPreview.set(true);
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
        error: (err: NzSafeAny) => this.message.error(err?.msg || err?.error?.msg || '预览失败')
      });
  }

  save(): void {
    const model = this.form();
    const name = model.schemaName?.trim();
    if (!name) {
      this.message.warning('请填写方案名称');
      return;
    }
    const request = buildCodeGenRequest(model, this.message);
    if (!request) {
      return;
    }
    const body = {
      name,
      ...(model.schemaRemark?.trim() ? { remark: model.schemaRemark.trim() } : {}),
      request
    };

    this.saving.set(true);
    const req$ =
      this.data.mode === 'edit' && this.data.schemaId != null
        ? this.codegenService.updateSchema(this.data.schemaId, body)
        : this.codegenService.createSchema(body);

    req$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => this.modalRef.close(true),
        error: (err: NzSafeAny) => this.message.error(err?.msg || err?.error?.msg || '保存失败')
      });
  }

  cancel(): void {
    this.modalRef.close(false);
  }

  copyContent(content: string): void {
    void navigator.clipboard.writeText(content).then(
      () => this.message.success('已复制'),
      () => this.message.error('复制失败')
    );
  }

  private loadDetail(id: number): void {
    this.loading.set(true);
    this.codegenService
      .getSchemaDetail(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: detail => this.form.set(formModelFromDetail(detail)),
        error: (err: NzSafeAny) => {
          this.message.error(err?.msg || err?.error?.msg || '加载方案失败');
          this.modalRef.close(false);
        }
      });
  }
}
