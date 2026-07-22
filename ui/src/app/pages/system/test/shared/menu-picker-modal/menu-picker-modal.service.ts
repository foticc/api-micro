import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { MenuPickerModalComponent, MenuPickerModalData } from '@app/pages/system/test/shared/menu-picker-modal/menu-picker-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class MenuPickerModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<MenuPickerModalComponent> {
    return MenuPickerModalComponent;
  }

  public show(modalOptions: ModalOptions = {}, modalData?: MenuPickerModalData): Observable<ModalResponse> {
    return this.modalWrapService.show<MenuPickerModalComponent, MenuPickerModalData>(this.getContentComponent(), modalOptions, modalData);
  }
}
