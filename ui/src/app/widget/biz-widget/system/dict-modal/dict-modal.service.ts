import { inject, Injectable, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { DictDTO } from '@services/system/dict.service';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';
import { DictModalComponent } from '@widget/biz-widget/system/dict-modal/dict-modal.component';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Injectable({
  providedIn: 'root'
})
export class DictModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<DictModalComponent> {
    return DictModalComponent;
  }

  public show(modalOptions: ModalOptions = {}, modalData?: DictDTO): Observable<ModalResponse> {
    return this.modalWrapService.show<DictModalComponent, DictDTO>(this.getContentComponent(), modalOptions, modalData);
  }
}
