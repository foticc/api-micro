import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

import { RbacRolePayload } from '../../models/rbac.models';
import { TestRoleModalComponent } from '../../role-assignment/test-role-modal/test-role-modal.component';

@Service()
export class TestRoleModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<TestRoleModalComponent> {
    return TestRoleModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: RbacRolePayload): Observable<ModalResponse> {
    return this.modalWrapService.show<TestRoleModalComponent, RbacRolePayload>(this.getContentComponent(), modalOptions, modalData);
  }
}
