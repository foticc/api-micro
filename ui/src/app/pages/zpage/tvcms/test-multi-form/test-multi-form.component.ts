import { Component, DestroyRef, forwardRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { OptionsInterface } from '@core/services/types';
import { ValidatorsService } from '@core/services/validators/validators.service';
import { DeptService } from '@services/system/dept.service';
import { RoleService } from '@services/system/role.service';
import { fnCheckForm } from '@utils/tools';
import { fnAddTreeDataGradeAndLeaf, fnFlatDataHasParentToTree } from '@utils/treeTableTools';
import { BasicConfirmModalComponent } from '@widget/base-modal';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzColDirective, NzRowDirective } from 'ng-zorro-antd/grid';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzRadioComponent, NzRadioGroupComponent } from 'ng-zorro-antd/radio';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { NzSwitchComponent } from 'ng-zorro-antd/switch';
import { NzTreeSelectComponent } from 'ng-zorro-antd/tree-select';

// 不要在这里定义，这里只是写个例子
interface WareHouseManageObj {
  warehouseName: string;
  warehouseDomainName: string;
  warehouseManager: string;
  approver: string;
  effectiveTime: string;
  warehouseType: string;
}

const EXE_COUNTER_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  multi: true,
  useExisting: forwardRef(() => TestMultiFormComponent)
};

@Component({
  selector: 'app-test-multi-form',
  imports: [
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    ReactiveFormsModule,
    NzInputDirective,
    NzRowDirective,
    NzFormDirective,
    NzOptionComponent,
    NzRadioComponent,
    NzRadioGroupComponent,
    NzSelectComponent,
    NzSwitchComponent,
    NzTreeSelectComponent
  ],
  templateUrl: './test-multi-form.component.html',
  standalone: true,
  styleUrl: './test-multi-form.component.less'
})
export class TestMultiFormComponent extends BasicConfirmModalComponent implements OnInit {
  getCurrentValue(): Observable<NzSafeAny> {
    return of(1);
  }

  private fb = inject(FormBuilder);
  private validatorsService = inject(ValidatorsService);
  private roleService = inject(RoleService);
  private deptService = inject(DeptService);

  deptNodes: NzTreeNodeOptions[] = [];

  isEdit = false;
  validateForm!: FormGroup;
  onChange: (value: string) => void = () => null;
  onTouched: () => void = () => null;
  destroyRef = inject(DestroyRef);
  roleOptions: OptionsInterface[] = [];

  initForm(): void {
    this.validateForm = this.fb.group({
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

  getDeptList(): Promise<void> {
    return new Promise<void>(resolve => {
      this.deptService.getDeptList({ page: 0, size: 0 }).subscribe(list => {
        list.forEach(item => {
          // @ts-ignore
          item.title = item.departmentName;
          // @ts-ignore
          item.key = item.id;
        });
        this.deptNodes = fnAddTreeDataGradeAndLeaf(fnFlatDataHasParentToTree(list));
        resolve();
      });
    });
  }

  async ngOnInit(): Promise<void> {
    this.initForm();
    await Promise.all([this.getRoleList(), this.getDeptList()]);
    if (this.isEdit) {
      // this.validateForm.patchValue(this.nzModalData);
      this.validateForm.controls['password'].disable();
    }
  }

  getRoleList(): Promise<void> {
    return new Promise<void>(resolve => {
      this.roleService.getRoles({}).subscribe(content => {
        this.roleOptions = [];
        content.forEach(({ id, roleName }) => {
          const obj: OptionsInterface = {
            label: roleName,
            value: id!
          };
          this.roleOptions.push(obj);
        });
        resolve();
      });
    });
  }

  registerOnChange(fn: NzSafeAny): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: NzSafeAny): void {}

  checkForm(): boolean {
    // 用下面方式让formArray每一项置脏（如果有formArray的话，这里只是做个示例）
    /* ((this.validateForm.get('fontImgArray') as FormArray).controls).forEach(item => {
       fnCheckForm(item as FormGroup);
     })*/
    return !fnCheckForm(this.validateForm);
  }

  setDisabledState(isDisabled: boolean): void {}

  writeValue(obj: WareHouseManageObj): void {
    if (obj) {
      this.validateForm.patchValue(obj);
    }
  }
}
