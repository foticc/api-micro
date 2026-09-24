import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { IotDevice } from '@app/pages/system/test/iot/device/models/iot-device.models';
import { IotProduct } from '@app/pages/system/test/iot/product/models/iot-product.models';
import { IotProductService } from '@app/pages/system/test/iot/product/services/iot-product.service';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-iot-device-modal',
  templateUrl: './iot-device-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule, NzSelectModule]
})
export class IotDeviceModalComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;
  readonly nzModalData: IotDevice | null = inject(NZ_MODAL_DATA, { optional: true });
  readonly products = signal<IotProduct[]>([]);
  isEdit = false;

  private fb = inject(FormBuilder);
  private productService = inject(IotProductService);
  override modalRef = inject(NzModalRef);

  protected getAsyncFnData(modalValue: NzSafeAny): Observable<NzSafeAny> {
    return of(modalValue);
  }

  override getCurrentValue(): Observable<NzSafeAny> {
    if (!fnCheckForm(this.addEditForm)) {
      return of(false);
    }
    return of(this.addEditForm.getRawValue());
  }

  ngOnInit(): void {
    this.isEdit = !!this.nzModalData?.id;
    this.addEditForm = this.fb.group({
      productId: [this.nzModalData?.productId ?? null, [Validators.required]],
      serialNo: [this.nzModalData?.serialNo ?? null, [Validators.required, Validators.maxLength(128)]],
      nickname: [this.nzModalData?.nickname ?? null, [Validators.maxLength(128)]],
      iotdbPath: [this.nzModalData?.iotdbPath ?? null, [Validators.maxLength(512)]],
      fwVersion: [this.nzModalData?.fwVersion ?? null]
    });
    if (this.isEdit) {
      this.addEditForm.get('productId')?.disable();
      this.addEditForm.get('serialNo')?.disable();
    }
    this.productService.page({ pageIndex: 1, pageSize: 200, filters: {} }).subscribe(page => {
      this.products.set(page?.list ?? []);
    });
  }
}
