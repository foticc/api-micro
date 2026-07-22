import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiPickerModalComponent, ApiPickerModalData } from '@app/pages/system/test/shared/api-picker-modal/api-picker-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class ApiPickerModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<ApiPickerModalComponent> {
    return ApiPickerModalComponent;
  }

  public show(modalOptions: ModalOptions = {}, modalData?: ApiPickerModalData): Observable<ModalResponse> {
    return this.modalWrapService.show<ApiPickerModalComponent, ApiPickerModalData>(this.getContentComponent(), modalOptions, modalData);
  }
}
