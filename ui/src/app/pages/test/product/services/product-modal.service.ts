import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ProductVO } from '../models/product.models';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { ModalResponse, ModalWrapService } from '@widget/base-modal';

import { ModalOptions } from 'ng-zorro-antd/modal';

@Service()
export class ProductModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<ProductModalComponent> {
    return ProductModalComponent;
  }

  show(modalOptions: ModalOptions = {}, modalData?: ProductVO): Observable<ModalResponse> {
    return this.modalWrapService.show<ProductModalComponent, ProductVO>(this.getContentComponent(), modalOptions, modalData);
  }
}
