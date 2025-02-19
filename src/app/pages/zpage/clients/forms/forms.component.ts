import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
import { NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzColDirective, NzRowDirective } from 'ng-zorro-antd/grid';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzInputDirective, NzInputGroupComponent } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzRadioComponent, NzRadioGroupComponent } from 'ng-zorro-antd/radio';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';

import { Clients, ClientService } from '../../api/client.service';

@Component({
  selector: 'app-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzInputDirective,
    NzRowDirective,
    ReactiveFormsModule,
    NzDatePickerComponent,
    NzRadioGroupComponent,
    NzRadioComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzIconDirective,
    NzInputGroupComponent,
  ],
  templateUrl: './forms.component.html',
  styleUrl: './forms.component.less'
})
export class FormsComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;
  private fb = inject(FormBuilder);
  private api = inject(ClientService);
  passwordVisible = false;

  readonly nzModalData: Clients = inject(NZ_MODAL_DATA);

  override modalRef = inject(NzModalRef);
  checkOptionsGrantTypes = [
    { label: 'authorization_code', value: 'authorization_code', checked: true },
    { label: 'refresh_token', value: 'refresh_token' },
    { label: 'authorization_password', value: 'authorization_password' }
  ];

  checkOptionsMethods = [
    { label: 'client_secret_basic', value: 'client_secret_basic', checked: true },
    { label: 'client_secret_post', value: 'client_secret_post' },
    { label: 'client_secret_jwt', value: 'client_secret_jwt' }
  ];

  getCurrentValue(): NzSafeAny {
    if (!fnCheckForm(this.addEditForm)) {
      return of(false);
    }
    return this.api.save(this.addEditForm.value).pipe(
      catchError(() => {
        return of(false);
      })
    );
  }

  initForm(): void {
    this.addEditForm = this.fb.group({
      clientId: [null, [Validators.required]],
      clientIdIssuedAt: [null, [Validators.required]],
      clientSecret: [null, [Validators.required]],
      clientSecretExpiresAt: [null, []],
      clientName: [null, [Validators.required]],
      clientAuthenticationMethods: [null, [Validators.required]],
      authorizationGrantTypes: [null, [Validators.required]],
      redirectUris: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.modalRef.updateConfig({
      nzTitle: '更新名称'
    });
    if (!!this.nzModalData) {
      this.addEditForm.patchValue(this.nzModalData);
    }
  }

  protected readonly sessionStorage = sessionStorage;
}
