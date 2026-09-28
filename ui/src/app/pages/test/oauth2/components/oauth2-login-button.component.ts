import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { TestOAuth2Service } from '../services/test-oauth2.service';
import { resolveOAuthErrorMessage } from '../utils/oauth-error.util';

@Component({
  selector: 'app-oauth2-login-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzButtonModule, NzIconModule, NzTooltipModule],
  template: `
    <button type="button" nz-button nz-tooltip nzShape="circle" nzSize="large" nzTooltipTitle="OAuth2 登录" nzType="default" [disabled]="!enabled() || loading()" (click)="onOAuthLogin($event)">
      <i nz-icon nzTheme="fill" nzType="safety-certificate"></i>
    </button>
  `
})
export class OAuth2LoginButtonComponent {
  private testOAuth2 = inject(TestOAuth2Service);
  private message = inject(NzMessageService);

  readonly enabled = signal(this.testOAuth2.isEnabled());
  readonly loading = signal(false);

  onOAuthLogin(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.enabled()) {
      this.message.warning('OAuth2 未启用，请在 test/oauth2 配置中开启');
      return;
    }

    this.loading.set(true);
    void this.testOAuth2.startLogin().catch(err => {
      this.message.error(resolveOAuthErrorMessage(err, 'OAuth2 登录启动失败'));
      this.loading.set(false);
    });
  }
}
