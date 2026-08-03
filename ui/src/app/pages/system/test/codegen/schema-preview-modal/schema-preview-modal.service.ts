import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { SchemaPreviewModalData } from '@app/pages/system/test/codegen/models/codegen-modal.models';
import { SchemaPreviewModalComponent } from '@app/pages/system/test/codegen/schema-preview-modal/schema-preview-modal.component';

import { NzModalService } from 'ng-zorro-antd/modal';

@Service()
export class SchemaPreviewModalService {
  private modal = inject(NzModalService);

  open(data: SchemaPreviewModalData): Observable<void> {
    const title = data.name ? `预览：${data.name}` : '预览代码';
    const ref = this.modal.create({
      nzTitle: title,
      nzContent: SchemaPreviewModalComponent,
      nzData: data,
      nzWidth: 1000,
      nzFooter: null,
      nzMaskClosable: true,
      nzStyle: { top: '40px' },
      nzBodyStyle: { maxHeight: '75vh', overflow: 'auto' }
    });
    return new Observable<void>(subscriber => {
      ref.afterClose.subscribe(() => {
        subscriber.next();
        subscriber.complete();
      });
    });
  }
}
