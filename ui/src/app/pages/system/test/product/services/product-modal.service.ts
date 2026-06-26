import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ProductVO } from '@app/pages/system/test/product/models/product.models';
import { ProductModalComponent } from '@app/pages/system/test/product/product-modal/product-modal.component';
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
