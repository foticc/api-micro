import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { IotDevice } from '@app/pages/system/test/iot/device/models/iot-device.models';
import { IotDeviceModalComponent } from '@app/pages/system/test/iot/device/device-modal/iot-device-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class IotDeviceModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<IotDeviceModalComponent> {
    return IotDeviceModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: IotDevice): Observable<ModalResponse> {
    return this.modalWrapService.show<IotDeviceModalComponent, IotDevice>(this.getContentComponent(), modalOptions, modalData);
  }
}
