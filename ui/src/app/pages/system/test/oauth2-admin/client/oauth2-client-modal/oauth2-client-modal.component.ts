import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { RegisteredClientDTO, RegisteredClientFormValue, toRegisteredClientDto, toRegisteredClientForm } from '@app/pages/system/test/models/oauth2-admin.models';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

@Component({
  selector: 'app-oauth2-client-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule, NzSelectModule, NzSwitchModule, NzDividerModule, NzAlertModule],
  templateUrl: './oauth2-client-modal.component.html',
  styles: `
    :host {
      display: block;
    }

    .form-section {
      margin-top: 16px;
    }

    .section-title {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
    }

    .section-panel {
      padding: 14px 16px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      background: #fafafa;
    }

    .switch-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
    }

    .switch-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-width: 220px;
      padding: 10px 12px;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 6px;
    }

    .switch-label {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.75);
    }

    .uri-tags-select {
      width: 100%;
    }

    :host ::ng-deep .uri-tags-select .ant-select-selection-item {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.4;
    }

    :host ::ng-deep .scope-tags-select .ant-select-selection-item {
      font-size: 13px;
    }

    .field-tip {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
  `
})
export class OAuth2ClientModalComponent extends BasicConfirmModalComponent implements OnInit {
  form!: FormGroup;
  readonly nzModalData: RegisteredClientDTO | null = inject(NZ_MODAL_DATA, { optional: true });
  isEdit = false;

  readonly authMethodOptions = [
    { label: 'none（公开客户端）', value: 'none' },
    { label: 'client_secret_basic', value: 'client_secret_basic' },
    { label: 'client_secret_post', value: 'client_secret_post' }
  ];

  readonly grantTypeOptions = [
    { label: 'authorization_code', value: 'authorization_code' },
    { label: 'refresh_token', value: 'refresh_token' },
    { label: 'client_credentials', value: 'client_credentials' }
  ];

  /** 标签输入：回车、逗号、换行、空格均可分隔 */
  readonly uriTokenSeparators = [',', '\n'];
  readonly scopeTokenSeparators = [',', '\n', ' '];

  private fb = inject(FormBuilder);
  override modalRef = inject(NzModalRef);

  protected getAsyncFnData(modalValue: NzSafeAny): Observable<NzSafeAny> {
    return of(modalValue);
  }

  override getCurrentValue(): Observable<NzSafeAny> {
    if (!fnCheckForm(this.form)) {
      return of(false);
    }
    const raw = this.form.getRawValue() as RegisteredClientFormValue;
    return of(toRegisteredClientDto(raw));
  }

  ngOnInit(): void {
    this.isEdit = !!this.nzModalData?.id;
    this.form = this.fb.group({
      id: [null],
      clientId: [null, [Validators.required]],
      clientName: [null],
      clientSecret: [null],
      clientAuthenticationMethods: [['none']],
      authorizationGrantTypes: [['authorization_code']],
      redirectUris: [[]],
      postLogoutRedirectUris: [[]],
      scopes: [['openid', 'profile']],
      requireProofKey: [true],
      requireAuthorizationConsent: [false]
    });

    if (this.isEdit && this.nzModalData) {
      this.form.patchValue(toRegisteredClientForm(this.nzModalData));
      this.form.controls['clientId'].disable();
      this.form.controls['clientSecret'].clearValidators();
    } else {
      this.form.controls['clientSecret'].setValidators([Validators.required]);
    }
    this.form.controls['clientSecret'].updateValueAndValidity();
  }
}
