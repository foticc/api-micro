import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ConsentDTO } from '../../../models/oauth2-admin.models';
import { OAuth2ConsentModalComponent } from './oauth2-consent-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class OAuth2ConsentModalService {
  private modalWrapService = inject(ModalWrapService);

  show(modalOptions: ModalOptions = {}, modalData?: ConsentDTO): Observable<ModalResponse> {
    return this.modalWrapService.show<OAuth2ConsentModalComponent, ConsentDTO>(OAuth2ConsentModalComponent as Type<OAuth2ConsentModalComponent>, modalOptions, modalData);
  }
}
