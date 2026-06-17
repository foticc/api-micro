import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { TestMenuModalData } from '@app/pages/system/test/models/test-menu.models';
import { TestMenuModalComponent } from '@app/pages/system/test/menu/test-menu-modal/test-menu-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class TestMenuModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<TestMenuModalComponent> {
    return TestMenuModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: TestMenuModalData): Observable<ModalResponse> {
    return this.modalWrapService.show<TestMenuModalComponent, TestMenuModalData>(this.getContentComponent(), modalOptions, modalData);
  }
}
