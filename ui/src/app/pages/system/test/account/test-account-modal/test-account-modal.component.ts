import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { TestUser } from '@app/pages/system/test/models/test-account.models';
import { OptionsInterface } from '@core/services/types';
import { ValidatorsService } from '@core/services/validators/validators.service';
import { RoleService } from '@services/system/role.service';
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
  roleOptions: OptionsInterface[] = [];
  isEdit = false;

  private fb = inject(FormBuilder);
  private validatorsService = inject(ValidatorsService);
  private roleService = inject(RoleService);
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

  getRoleList(): Promise<void> {
    return new Promise<void>(resolve => {
      this.roleService.getRoles({ pageIndex: 0, pageSize: 0 }).subscribe(list => {
        this.roleOptions = list.map(({ id, roleName }) => ({
          label: roleName,
          value: id!
        }));
        resolve();
      });
    });
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

  async ngOnInit(): Promise<void> {
    this.initForm();
    this.isEdit = !!this.nzModalData;
    await this.getRoleList();
    if (this.isEdit && this.nzModalData) {
      this.addEditForm.patchValue(this.nzModalData);
      this.addEditForm.controls['password'].disable();
    }
  }
}
