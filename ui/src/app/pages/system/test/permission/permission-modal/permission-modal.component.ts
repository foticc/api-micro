import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { RbacPermissionPayload } from '@app/pages/system/test/models/rbac.models';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-permission-modal',
  templateUrl: './permission-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzInputModule]
})
export class PermissionModalComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;

  readonly nzModalData: RbacPermissionPayload | null = inject(NZ_MODAL_DATA, { optional: true });

  private fb = inject(FormBuilder);
  override modalRef = inject(NzModalRef);

  protected getAsyncFnData(modalValue: NzSafeAny): Observable<NzSafeAny> {
    return of(modalValue);
  }

  override getCurrentValue(): Observable<NzSafeAny> {
    if (!fnCheckForm(this.addEditForm)) {
      return of(false);
    }
    const raw = this.addEditForm.getRawValue() as RbacPermissionPayload;
    return of({
      module: raw.module?.trim(),
      code: raw.code?.trim(),
      name: raw.name?.trim(),
      description: raw.description?.trim() || undefined
    });
  }

  initForm(): void {
    this.addEditForm = this.fb.group({
      module: ['', [Validators.required]],
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.initForm();
    if (this.nzModalData) {
      this.addEditForm.patchValue(this.nzModalData);
    }
  }
}
