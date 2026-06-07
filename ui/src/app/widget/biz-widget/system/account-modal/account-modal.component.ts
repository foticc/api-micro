import { Component, inject, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { OptionsInterface } from '@core/services/types';
import { ValidatorsService } from '@core/services/validators/validators.service';
import { User } from '@services/system/account.service';
import { DeptService } from '@services/system/dept.service';
import { RoleService } from '@services/system/role.service';
import { fnCheckForm } from '@utils/tools';
import { fnAddTreeDataGradeAndLeaf, fnFlatDataHasParentToTree } from '@utils/treeTableTools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';

@Component({
  selector: 'app-account-modal',
  templateUrl: './account-modal.component.html',

  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule, NzRadioModule, NzSwitchModule, NzTreeSelectModule, NzSelectModule]
})
export class AccountModalComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;
  readonly nzModalData: User = inject(NZ_MODAL_DATA);
  isEdit = false;
  value?: string;

  private fb = inject(FormBuilder);
  private validatorsService = inject(ValidatorsService);
  private roleService = inject(RoleService);
  private deptService = inject(DeptService);
  override modalRef = inject(NzModalRef);

  roleResource = this.roleService.getRolesResource(() => ({ pageIndex: 0, pageSize: 0, filters: {} as NzSafeAny }));
  deptResource = this.deptService.getDeptsResource(() => ({ pageIndex: 0, pageSize: 0, filters: {} as NzSafeAny }));

  roleOptions = computed<OptionsInterface[]>(() => {
    if (!this.roleResource.hasValue()) return [];
    return this.roleResource.value().list.map(({ id, roleName }) => ({
      label: roleName,
      value: id!
    }));
  });

  deptNodes = computed<NzTreeNodeOptions[]>(() => {
    if (!this.deptResource.hasValue()) return [];
    const list = this.deptResource.value().list;
    list.forEach(item => {
      // @ts-ignore
      item.title = item.departmentName;
      // @ts-ignore
      item.key = item.id;
    });
    return fnAddTreeDataGradeAndLeaf(fnFlatDataHasParentToTree(list));
  });

  // 此方法为如果有异步数据需要加载，则在该方法中添加
  protected getAsyncFnData(modalValue: NzSafeAny): Observable<NzSafeAny> {
    return of(modalValue);
  }

  // 返回false则不关闭对话框
  override getCurrentValue(): Observable<NzSafeAny> {
    if (!fnCheckForm(this.addEditForm)) {
      return of(false);
    }
    return of(this.addEditForm.value);
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
      roleId: [null, [Validators.required]],
      departmentId: [null, [Validators.required]]
    });
  }

  async ngOnInit(): Promise<void> {
    this.initForm();
    this.isEdit = !!this.nzModalData;
    if (this.isEdit) {
      this.addEditForm.patchValue(this.nzModalData);
      this.addEditForm.controls['password'].disable();
    }
  }
}
