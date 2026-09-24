import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { IOT_STATUS_OPTIONS, IotProduct } from '@app/pages/system/test/iot/product/models/iot-product.models';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-iot-product-modal',
  templateUrl: './iot-product-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule, NzSelectModule]
})
export class IotProductModalComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;
  readonly nzModalData: IotProduct | null = inject(NZ_MODAL_DATA, { optional: true });
  readonly statusOptions = IOT_STATUS_OPTIONS;
  isEdit = false;

  private fb = inject(FormBuilder);
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

  initForm(): void {
    this.addEditForm = this.fb.group({
      productKey: [null, [Validators.required, Validators.maxLength(64)]],
      name: [null, [Validators.required, Validators.maxLength(128)]],
      description: [null, [Validators.maxLength(512)]],
      authType: ['HMAC', [Validators.maxLength(16)]],
      iotdbPathPattern: ['root.iot.{productKey}.{serialNo}', [Validators.maxLength(256)]],
      status: ['ENABLED']
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.isEdit = !!this.nzModalData?.id;
    if (this.isEdit && this.nzModalData) {
      this.addEditForm.patchValue(this.nzModalData);
      this.addEditForm.get('productKey')?.disable();
    }
  }
}
