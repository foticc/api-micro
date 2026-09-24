import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { IotProduct } from '@app/pages/system/test/iot/product/models/iot-product.models';
import { IotProductModalComponent } from '@app/pages/system/test/iot/product/product-modal/iot-product-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class IotProductModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<IotProductModalComponent> {
    return IotProductModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: IotProduct): Observable<ModalResponse> {
    return this.modalWrapService.show<IotProductModalComponent, IotProduct>(this.getContentComponent(), modalOptions, modalData);
  }
}
