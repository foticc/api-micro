import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

import { TestMenuModalComponent } from '../../menu/test-menu-modal/test-menu-modal.component';
import { TestMenuModalData } from '../../models/test-menu.models';

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
