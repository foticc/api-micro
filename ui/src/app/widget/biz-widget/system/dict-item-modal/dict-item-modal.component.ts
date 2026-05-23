import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { DictItemDTO } from '@services/system/dict.service';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

export interface DictItemModalData {
  dictId: number;
  record?: DictItemDTO;
}

@Component({
  selector: 'app-dict-item-modal',
  templateUrl: './dict-item-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule]
})
export class DictItemModalComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;

  readonly nzModalData = inject<DictItemModalData | null>(NZ_MODAL_DATA, { optional: true });
  private fb = inject(FormBuilder);
  override modalRef = inject(NzModalRef);

  initForm(): void {
    this.addEditForm = this.fb.group({
      value: [null, [Validators.required]],
      label: [null, [Validators.required]],
      dictId: [null, [Validators.required]]
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
    const data = this.nzModalData;
    if (data) {
      this.addEditForm.patchValue({
        dictId: data.dictId,
        value: data.record?.value ?? null,
        label: data.record?.label ?? null
      });
    }
  }
}
