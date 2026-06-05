import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { ConsentDTO, toConsentDto, toConsentForm } from '@app/pages/system/test/models/oauth2-admin.models';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-oauth2-consent-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule],
  templateUrl: './oauth2-consent-modal.component.html'
})
export class OAuth2ConsentModalComponent extends BasicConfirmModalComponent implements OnInit {
  form!: FormGroup;
  readonly nzModalData: ConsentDTO | null = inject(NZ_MODAL_DATA, { optional: true });
  isEdit = false;

  private fb = inject(FormBuilder);
  override modalRef = inject(NzModalRef);

  protected getAsyncFnData(modalValue: NzSafeAny): Observable<NzSafeAny> {
    return of(modalValue);
  }

  override getCurrentValue(): Observable<NzSafeAny> {
    if (!fnCheckForm(this.form)) {
      return of(false);
    }
    return of(toConsentDto(this.form.getRawValue()));
  }

  ngOnInit(): void {
    this.isEdit = !!this.nzModalData?.registeredClientId;
    this.form = this.fb.group({
      registeredClientId: [null, [Validators.required]],
      principalName: [null, [Validators.required]],
      authoritiesText: [null]
    });
    if (this.isEdit && this.nzModalData) {
      this.form.patchValue(toConsentForm(this.nzModalData));
      this.form.controls['registeredClientId'].disable();
      this.form.controls['principalName'].disable();
    }
  }
}
