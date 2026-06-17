import { ChangeDetectionStrategy, Component, inject, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { TestUser } from '@app/pages/system/test/models/test-account.models';
import { OptionsInterface } from '@core/services/types';
import { ValidatorsService } from '@core/services/validators/validators.service';
import { RbacTestService } from '@services/system/rbac-test.service';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

@Component({
  selector: 'app-test-account-modal',
  templateUrl: './test-account-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule, NzRadioModule, NzSwitchModule, NzSelectModule]
})
export class TestAccountModalComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;
  readonly nzModalData: TestUser | null = inject(NZ_MODAL_DATA, { optional: true });
  isEdit = false;

  private fb = inject(FormBuilder);
  private validatorsService = inject(ValidatorsService);
  private rbacTestService = inject(RbacTestService);
  override modalRef = inject(NzModalRef);

  rolesResource = this.rbacTestService.getRolesListResource();

  roleOptions = computed<OptionsInterface[]>(() => {
    if (!this.rolesResource.hasValue()) {
      return [];
    }
    return this.rolesResource.value().map(({ id, roleName }) => ({
      label: roleName,
      value: id!
    }));
  });

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
      userName: [null, [Validators.required]],
      password: ['a123456', [Validators.required, this.validatorsService.passwordValidator()]],
      sex: [1],
      available: [true],
      telephone: [null, [this.validatorsService.telephoneValidator()]],
      mobile: [null, [this.validatorsService.mobileValidator()]],
      email: [null, [this.validatorsService.emailValidator()]],
      roleId: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.isEdit = !!this.nzModalData;
    if (this.isEdit && this.nzModalData) {
      this.addEditForm.patchValue(this.nzModalData);
      this.addEditForm.controls['password'].disable();
    }
  }
}
