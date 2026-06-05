import { inject, Injectable, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { RegisteredClientDTO } from '@app/pages/system/test/models/oauth2-admin.models';
import { OAuth2ClientModalComponent } from '@app/pages/system/test/oauth2-admin/client/oauth2-client-modal/oauth2-client-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Injectable({ providedIn: 'root' })
export class OAuth2ClientModalService {
  private modalWrapService = inject(ModalWrapService);

  show(modalOptions: ModalOptions = {}, modalData?: RegisteredClientDTO): Observable<ModalResponse> {
    return this.modalWrapService.show<OAuth2ClientModalComponent, RegisteredClientDTO>(
      OAuth2ClientModalComponent as Type<OAuth2ClientModalComponent>,
      modalOptions,
      modalData
    );
  }
}
