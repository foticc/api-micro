import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { RegisteredClientDTO } from '../../../models/oauth2-admin.models';
import { OAuth2ClientModalComponent } from './oauth2-client-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class OAuth2ClientModalService {
  private modalWrapService = inject(ModalWrapService);

  show(modalOptions: ModalOptions = {}, modalData?: RegisteredClientDTO): Observable<ModalResponse> {
    return this.modalWrapService.show<OAuth2ClientModalComponent, RegisteredClientDTO>(OAuth2ClientModalComponent as Type<OAuth2ClientModalComponent>, modalOptions, modalData);
  }
}
