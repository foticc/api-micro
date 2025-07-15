import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Dict, DictService } from '@app/pages/zpage/dict/dict.service';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzColDirective } from 'ng-zorro-antd/grid';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-forms',
  imports: [NzFormModule, ReactiveFormsModule, NzColDirective, NzInputDirective],
  templateUrl: './dict.forms.component.html',
  standalone: true,
  styleUrl: './dict.forms.component.less'
})
export class DictFormsComponent extends BasicConfirmModalComponent implements OnInit {
  protected addEditForm!: FormGroup;
  private fb = inject(FormBuilder);
  private service = inject(DictService);
  override modalRef = inject(NzModalRef);

  readonly nzModalData: Dict = inject(NZ_MODAL_DATA);

  isEdit = false;

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
    this.isEdit = !!this.nzModalData;
    this.initForm();
    if (this.isEdit) {
      this.addEditForm.patchValue(this.nzModalData);
    }
  }

  initForm(): void {
    this.addEditForm = this.fb.group({
      id: [null],
      code: [null, [Validators.maxLength(100)]],
      name: [null, [Validators.maxLength(255)]]
    });
  }
}
