import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { AuditDemoVO } from '../../audit-demo/models/audit-demo.models';

@Component({
  selector: 'app-audit-demo-modal',
  templateUrl: './audit-demo-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule]
})
export class AuditDemoModalComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;
  readonly nzModalData: AuditDemoVO | null = inject(NZ_MODAL_DATA, { optional: true });
  isEdit = false;

  private fb = inject(FormBuilder);
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

  initForm(): void {
    this.addEditForm = this.fb.group({
      title: ['', [Validators.required]],
      content: ['']
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.isEdit = !!this.nzModalData;
    if (this.isEdit && this.nzModalData) {
      this.addEditForm.patchValue({
        title: this.nzModalData.title,
        content: this.nzModalData.content ?? ''
      });
    }
  }
}
