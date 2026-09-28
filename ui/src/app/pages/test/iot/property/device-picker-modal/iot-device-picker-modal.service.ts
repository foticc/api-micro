import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { IotDevice } from '../../device/models/iot-device.models';
import { IotDevicePickerModalComponent } from './iot-device-picker-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class IotDevicePickerModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<IotDevicePickerModalComponent> {
    return IotDevicePickerModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: IotDevice): Observable<ModalResponse> {
    return this.modalWrapService.show<IotDevicePickerModalComponent, IotDevice>(this.getContentComponent(), modalOptions, modalData);
  }
}
