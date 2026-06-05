import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SpinService } from '@store/common-store/spin.service';

import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

import { TestOAuth2Service } from './services/test-oauth2.service';
import { resolveOAuthErrorMessage } from './utils/oauth-error.util';

@Component({
  selector: 'app-oauth2-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzSpinModule],
  template: `
    <div class="oauth2-callback">
      <nz-spin nzSimple nzSize="large" />
      <p>正在完成 OAuth2 登录…</p>
    </div>
  `,
  styles: `
    .oauth2-callback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 240px;
      color: rgba(0, 0, 0, 0.65);
    }
  `
})
export class OAuth2CallbackComponent implements OnInit {
  private testOAuth2 = inject(TestOAuth2Service);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private spinService = inject(SpinService);

  ngOnInit(): void {
    this.spinService.$globalSpinStore.set(true);
    void this.testOAuth2
      .completeCallbackLogin()
      .then(() => this.router.navigateByUrl('default/dashboard/analysis'))
      .catch(err => {
        this.message.error(resolveOAuthErrorMessage(err, 'OAuth2 登录失败'));
        return this.router.navigateByUrl('/login/login-form');
      })
      .finally(() => {
        this.spinService.$globalSpinStore.set(false);
      });
  }
}
