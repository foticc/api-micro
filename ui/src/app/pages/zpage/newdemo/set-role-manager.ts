import { inject, Injectable, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { NewdemoComponent } from '@app/pages/zpage/newdemo/newdemo.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';
import { RoleManageModalComponent } from '@widget/biz-widget/system/role-manage-modal/role-manage-modal.component';
import { ModalOptions } from 'ng-zorro-antd/modal';

@Injectable({
  providedIn: 'root'
})
export class SetRoleManagerService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<NewdemoComponent> {
    return NewdemoComponent;
  }

  public show(modalOptions: ModalOptions = {}, modalData: number): Observable<ModalResponse> {
    return this.modalWrapService.open<NewdemoComponent, number>(this.getContentComponent(), modalOptions, modalData);
  }
}
