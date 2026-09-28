import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { NzModalService } from 'ng-zorro-antd/modal';

import { SchemaFormModalData } from '../../codegen/models/codegen-modal.models';
import { SchemaFormModalComponent } from '../../codegen/schema-form-modal/schema-form-modal.component';

@Service()
export class SchemaFormModalService {
  private modal = inject(NzModalService);

  open(data: SchemaFormModalData): Observable<boolean> {
    const title = data.mode === 'edit' ? '编辑方案' : '新建方案';
    const ref = this.modal.create({
      nzTitle: title,
      nzContent: SchemaFormModalComponent,
      nzData: data,
      nzWidth: 960,
      nzFooter: null,
      nzMaskClosable: false,
      nzStyle: { top: '40px' },
      nzBodyStyle: { maxHeight: '75vh', overflow: 'auto', paddingBottom: '8px' }
    });
    return new Observable<boolean>(subscriber => {
      ref.afterClose.subscribe((result: boolean | undefined) => {
        subscriber.next(!!result);
        subscriber.complete();
      });
    });
  }
}
