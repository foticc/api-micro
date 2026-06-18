import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { AuditDemoVO } from '@app/pages/system/test/audit-demo/models/audit-demo.models';
import { AuditDemoModalComponent } from '@app/pages/system/test/audit-demo/audit-demo-modal/audit-demo-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class AuditDemoModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<AuditDemoModalComponent> {
    return AuditDemoModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: AuditDemoVO): Observable<ModalResponse> {
    return this.modalWrapService.show<AuditDemoModalComponent, AuditDemoVO>(this.getContentComponent(), modalOptions, modalData);
  }
}
