import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { TestAccountModalComponent } from '@app/pages/system/test/account/test-account-modal/test-account-modal.component';
import { TestUser } from '@app/pages/system/test/models/test-account.models';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

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
