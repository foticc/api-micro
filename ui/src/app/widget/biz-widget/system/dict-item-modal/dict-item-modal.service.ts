import { inject, Injectable, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ModalResponse, ModalWrapService } from '@widget/base-modal';
import { DictItemModalComponent, DictItemModalData } from '@widget/biz-widget/system/dict-item-modal/dict-item-modal.component';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Injectable({
  providedIn: 'root'
})
export class DictItemModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<DictItemModalComponent> {
    return DictItemModalComponent;
  }

  public show(modalOptions: ModalOptions = {}, modalData?: DictItemModalData): Observable<ModalResponse> {
    return this.modalWrapService.show<DictItemModalComponent, DictItemModalData>(this.getContentComponent(), modalOptions, modalData);
  }
}
