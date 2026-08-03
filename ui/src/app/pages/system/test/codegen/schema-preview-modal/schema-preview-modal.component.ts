import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { SchemaPreviewModalData } from '@app/pages/system/test/codegen/models/codegen-modal.models';
import { CodeGenRequest, CodeGenResult, CodeGenSchemaDetailVO, CodeGenTarget } from '@app/pages/system/test/codegen/models/codegen.models';
import { CodeGenService } from '@app/pages/system/test/codegen/services/codegen.service';
import { fileTabTitle, formModelFromDetail, buildCodeGenRequest, targetLabel } from '@app/pages/system/test/codegen/utils/codegen-form.util';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-schema-preview-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzButtonModule, NzIconModule, NzEmptyModule, NzRadioModule, NzSpinModule, NzTabsModule, NzTagModule],
  templateUrl: './schema-preview-modal.component.html',
  styleUrl: './schema-preview-modal.component.less'
})
export class SchemaPreviewModalComponent implements OnInit {
  private codegenService = inject(CodeGenService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);
  private modalRef = inject(NzModalRef);
  readonly data: SchemaPreviewModalData = inject(NZ_MODAL_DATA);

  loading = signal(false);
  previewLoading = signal(false);
  detail = signal<CodeGenSchemaDetailVO | null>(null);
  previewTarget = signal<CodeGenTarget>('backend');
  previewResult = signal<CodeGenResult | null>(null);
  activeFileTab = 0;

  targetLabel = targetLabel;
  fileTabTitle = fileTabTitle;

  ngOnInit(): void {
    this.loadAndPreview();
  }

  onTargetChange(target: CodeGenTarget): void {
    this.previewTarget.set(target);
    this.runPreview();
  }

  close(): void {
    this.modalRef.close();
  }

  copyContent(content: string): void {
    void navigator.clipboard.writeText(content).then(
      () => this.message.success('已复制'),
      () => this.message.error('复制失败')
    );
  }

  copyAll(): void {
    const result = this.previewResult();
    if (!result?.files.length) {
      return;
    }
    const text = result.files.map(f => `// ${f.relativePath}\n${f.content}`).join('\n\n');
    this.copyContent(text);
  }

  private loadAndPreview(): void {
    this.loading.set(true);
    this.codegenService
      .getSchemaDetail(this.data.schemaId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: detail => {
          this.detail.set(detail);
          const savedTarget: CodeGenTarget = detail.request.target === 'frontend' ? 'frontend' : 'backend';
          this.previewTarget.set(this.data.defaultTarget ?? savedTarget);
          this.runPreview();
        },
        error: (err: NzSafeAny) => {
          this.message.error(err?.msg || err?.error?.msg || '加载方案失败');
          this.modalRef.close();
        }
      });
  }

  private runPreview(): void {
    const detail = this.detail();
    if (!detail) {
      return;
    }
    const model = formModelFromDetail(detail);
    const body = buildCodeGenRequest(model, this.message, this.previewTarget());
    if (!body) {
      return;
    }
    this.doPreview(body);
  }

  private doPreview(body: CodeGenRequest): void {
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
        error: (err: NzSafeAny) => this.message.error(err?.msg || err?.error?.msg || '预览失败')
      });
  }
}
