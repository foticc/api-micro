import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { DictDTO } from '@services/system/dict.service';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-dict-modal',
  templateUrl: './dict-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule]
})
export class DictModalComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;

  readonly nzModalData = inject<DictDTO | null>(NZ_MODAL_DATA, { optional: true });
  private fb = inject(FormBuilder);
  override modalRef = inject(NzModalRef);

  initForm(): void {
    this.addEditForm = this.fb.group({
      code: [null, [Validators.required]],
      name: [null, [Validators.required]]
    });
  }

  protected getAsyncFnData(modalValue: NzSafeAny): Observable<NzSafeAny> {
    return of(modalValue);
  }

  override getCurrentValue(): Observable<NzSafeAny> {
    if (!fnCheckForm(this.addEditForm)) {
      return of(false);
    }
    return of(this.addEditForm.value);
  }

  ngOnInit(): void {
    this.initForm();
    if (this.nzModalData) {
      this.addEditForm.patchValue(this.nzModalData);
    }
  }
}
