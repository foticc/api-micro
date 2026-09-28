import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

import { TestAccountModalComponent } from '../../account/test-account-modal/test-account-modal.component';
import { TestUser } from '../../models/test-account.models';

@Service()
export class TestAccountModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<TestAccountModalComponent> {
    return TestAccountModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: TestUser): Observable<ModalResponse> {
    return this.modalWrapService.show<TestAccountModalComponent, TestUser>(this.getContentComponent(), modalOptions, modalData);
  }
}
