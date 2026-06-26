import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { RbacPermissionPayload } from '@app/pages/system/test/models/rbac.models';
import { PermissionModalComponent } from '@app/pages/system/test/permission/permission-modal/permission-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class PermissionModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<PermissionModalComponent> {
    return PermissionModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: RbacPermissionPayload): Observable<ModalResponse> {
    return this.modalWrapService.show<PermissionModalComponent, RbacPermissionPayload>(
      this.getContentComponent(),
      modalOptions,
      modalData
    );
  }
}
