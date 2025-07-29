import { inject, Injectable, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { SetMenuModalComponent } from '@app/pages/zpage/set-menu-modal/set-menu-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Injectable({
  providedIn: 'root'
})
export class SetRoleManagerService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<SetMenuModalComponent> {
    return SetMenuModalComponent;
  }

  public show(modalOptions: ModalOptions = {}, modalData: number): Observable<ModalResponse> {
    return this.modalWrapService.open<SetMenuModalComponent, number>(this.getContentComponent(), modalOptions, modalData);
  }
}
