import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiResource, ApiResourceService } from '@app/pages/zpage/apidemo/api-resource.service';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzColDirective } from 'ng-zorro-antd/grid';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { DictSelectComponent, SelectModel } from '@app/pages/zpage/apidemo/select/select.component';

@Component({
  selector: 'app-forms',
  imports: [NzFormModule, ReactiveFormsModule, NzColDirective, NzInputDirective, DictSelectComponent],
  templateUrl: './api-resource.forms.component.html',
  standalone: true,
  styleUrl: './api-resource.forms.component.less'
})
export class FormsComponent extends BasicConfirmModalComponent implements OnInit {
  protected addEditForm!: FormGroup;
  isEdit = false;
  private fb = inject(FormBuilder);
  readonly nzModalData: ApiResource = inject(NZ_MODAL_DATA);

  private service = inject(ApiResourceService);
  override modalRef = inject(NzModalRef);

  getCurrentValue(): NzSafeAny {
    if (!fnCheckForm(this.addEditForm)) {
      return of(false);
    }
    if (this.isEdit) {
      return this.service.update(this.addEditForm.value.id, this.addEditForm.value).pipe(
        catchError(() => {
          return of(false);
        })
      );
    }
    return this.service.create(this.addEditForm.value).pipe(
      catchError(() => {
        return of(false);
      })
    );
  }

  ngOnInit(): void {
    this.initForm();
    this.isEdit = !!this.nzModalData;
    if (this.isEdit) {
      this.addEditForm.patchValue(this.nzModalData);
    }
    console.log(this.nzModalData);
  }

  initForm(): void {
    this.addEditForm = this.fb.group({
      id: [null],
      method: [null, [Validators.required]],
      path: [null, [Validators.required]],
      description: [null, [Validators.required, Validators.maxLength(200)]]
    });
  }

  methodValues: SelectModel[] = [
    {
      value: 'get',
      label: 'get'
    },
    {
      value: 'post',
      label: 'post'
    },
    {
      value: 'put',
      label: 'put'
    }
  ];
}
