import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { IotTslModalData } from '@app/pages/system/test/iot/product/models/iot-product.models';
import { IotTslModalComponent } from '@app/pages/system/test/iot/product/tsl-modal/iot-tsl-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class IotTslModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<IotTslModalComponent> {
    return IotTslModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: IotTslModalData): Observable<ModalResponse> {
    return this.modalWrapService.show<IotTslModalComponent, IotTslModalData>(this.getContentComponent(), modalOptions, modalData);
  }
}
