import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { CodeGenSchemaListVO, CodeGenSchemaQueryParam, CodeGenTarget } from '@app/pages/system/test/codegen/models/codegen.models';
import { SchemaFormModalService } from '@app/pages/system/test/codegen/schema-form-modal/schema-form-modal.service';
import { SchemaPreviewModalService } from '@app/pages/system/test/codegen/schema-preview-modal/schema-preview-modal.service';
import { CodeGenService } from '@app/pages/system/test/codegen/services/codegen.service';
import { targetLabel } from '@app/pages/system/test/codegen/utils/codegen-form.util';
import { PageHeaderComponent, PageHeaderType } from '@shared/components/page-header/page-header.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-codegen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    PageHeaderComponent,
    FormsModule,
    NzCardModule,
    NzInputModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    NzTableModule,
    NzDividerModule,
    NzTagModule,
    NzPaginationModule
  ],
  templateUrl: './codegen.component.html',
  styleUrl: './codegen.component.less'
})
export class CodegenComponent {
  private codegenService = inject(CodeGenService);
  private formModal = inject(SchemaFormModalService);
  private previewModal = inject(SchemaPreviewModalService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  readonly pageHeader: Partial<PageHeaderType> = {
    title: '代码生成（测试）',
    desc: '管理生成方案：预览前后端源码，编辑配置后保存。仅预览与存方案，不写磁盘。'
  };

  schemaKeyword = '';
  private schemaFilters = signal<CodeGenSchemaQueryParam>({});
  private schemaPageIndex = signal(1);
  private schemaPageSize = signal(10);

  schemaPageResource = this.codegenService.getSchemaPageResource(() => ({
    pageIndex: this.schemaPageIndex(),
    pageSize: this.schemaPageSize(),
    filters: { ...this.schemaFilters() }
  }));

  schemaList = computed(() => {
    if (this.schemaPageResource.hasValue()) {
      return [...this.schemaPageResource.value().list];
    }
    return [] as CodeGenSchemaListVO[];
  });

  schemaTotal = computed(() => (this.schemaPageResource.hasValue() ? this.schemaPageResource.value().total : 0));
  schemaLoading = computed(() => this.schemaPageResource.isLoading());
  schemaPageIndexValue = this.schemaPageIndex.asReadonly();
  schemaPageSizeValue = this.schemaPageSize.asReadonly();

  targetLabel = targetLabel;

  searchSchemas(): void {
    this.schemaFilters.set({ keyword: this.schemaKeyword.trim() || undefined });
    this.schemaPageIndex.set(1);
  }

  resetSchemaSearch(): void {
    this.schemaKeyword = '';
    this.schemaFilters.set({});
    this.schemaPageIndex.set(1);
  }

  onSchemaPageIndexChange(pageIndex: number): void {
    this.schemaPageIndex.set(pageIndex);
  }

  onSchemaPageSizeChange(pageSize: number): void {
    this.schemaPageSize.set(pageSize);
    this.schemaPageIndex.set(1);
  }

  reloadSchemaList(): void {
    this.schemaPageResource.reload();
  }

  createSchema(): void {
    this.formModal
      .open({ mode: 'create' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ok => {
        if (ok) {
          this.reloadSchemaList();
        }
      });
  }

  editSchema(row: CodeGenSchemaListVO): void {
    this.formModal
      .open({ mode: 'edit', schemaId: row.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ok => {
        if (ok) {
          this.reloadSchemaList();
        }
      });
  }

  previewSchema(row: CodeGenSchemaListVO): void {
    this.previewModal
      .open({
        schemaId: row.id,
        name: row.name,
        defaultTarget: row.target === 'frontend' ? 'frontend' : ('backend' as CodeGenTarget)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  deleteSchema(row: CodeGenSchemaListVO): void {
    this.modal.confirm({
      nzTitle: '确认删除该方案？',
      nzContent: `方案「${row.name}」删除后不可恢复。`,
      nzOnOk: () =>
        new Promise<void>((resolve, reject) => {
          this.codegenService
            .deleteSchemas([row.id])
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.reloadSchemaList();
                resolve();
              },
              error: (err: NzSafeAny) => {
                this.message.error(err?.msg || err?.error?.msg || '删除失败');
                reject(err);
              }
            });
        })
    });
  }
}
