import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiResourceService } from '@app/pages/zpage/apidemo/apiresource.service';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzColDirective } from 'ng-zorro-antd/grid';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-forms',
  imports: [NzFormDirective, NzFormItemComponent, NzFormLabelComponent, NzFormControlComponent, ReactiveFormsModule, NzColDirective, NzInputDirective],
  templateUrl: './apiresource.forms.component.html',
  standalone: true,
  styleUrl: './apiresource.forms.component.less'
})
export class FormsComponent extends BasicConfirmModalComponent implements OnInit {
  protected addEditForm!: FormGroup;
  private fb = inject(FormBuilder);
  private service = inject(ApiResourceService);
  private ref = inject(NzModalRef);

  getCurrentValue(): NzSafeAny {
    if (!fnCheckForm(this.addEditForm)) {
      return of(false);
    }
    return this.service.create(this.addEditForm.value).pipe(
      catchError(() => {
        return of(false);
      })
    );
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.addEditForm = this.fb.group({
      method: [null, [Validators.required]],
      path: [null, [Validators.required]],
      description: [null, [Validators.required, Validators.maxLength(200)]]
    });
  }
}
