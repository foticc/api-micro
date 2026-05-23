import { inject, Injectable, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResource } from '@app/pages/system/api/models/api.models';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';
import { ApiModalComponent } from '@widget/biz-widget/system/api-modal/api-modal.component';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Injectable({
  providedIn: 'root'
})
export class ApiModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<ApiModalComponent> {
    return ApiModalComponent;
  }

  public show(modalOptions: ModalOptions = {}, modalData?: ApiResource): Observable<ModalResponse> {
    return this.modalWrapService.show<ApiModalComponent, ApiResource>(this.getContentComponent(), modalOptions, modalData);
  }
}