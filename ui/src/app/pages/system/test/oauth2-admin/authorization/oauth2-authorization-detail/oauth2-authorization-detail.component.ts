import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { AuthorizationDTO, OAuth2TokenSummary, setToLines } from '@app/pages/system/test/models/oauth2-admin.models';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

interface SecretField {
  key: string;
  label: string;
  value?: string;
}

interface TokenBlock {
  key: string;
  label: string;
  summary?: OAuth2TokenSummary;
}

@Component({
  selector: 'app-oauth2-authorization-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzDescriptionsModule, NzDividerModule, NzTagModule, NzButtonModule, NzIconModule],
  templateUrl: './oauth2-authorization-detail.component.html',
  styles: `
    :host {
      display: block;
    }

    .section-title {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
    }

    .token-card {
      padding: 12px 14px;
      margin-bottom: 12px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      background: #fafafa;
    }

    .token-card:last-child {
      margin-bottom: 0;
    }

    .token-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }

    .token-card-title {
      font-size: 13px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
    }

    .secret-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .secret-value {
      flex: 1;
      min-width: 0;
      padding: 8px 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      word-break: break-all;
      color: rgba(0, 0, 0, 0.75);
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 6px;
    }

    .secret-value.masked {
      letter-spacing: 2px;
      color: rgba(0, 0, 0, 0.45);
    }

    .token-meta {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px 12px;
      margin-top: 10px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.55);
    }

    .token-meta span {
      min-width: 0;
    }

    .empty-tip {
      padding: 8px 0;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.45);
    }
  `
})
export class OAuth2AuthorizationDetailComponent {
  readonly detail = inject<{ detail: AuthorizationDTO }>(NZ_MODAL_DATA).detail;
  private readonly visibleKeys = signal<Record<string, boolean>>({});

  readonly tokenBlocks: TokenBlock[] = [
    { key: 'accessToken', label: 'Access Token', summary: this.detail.accessToken },
    { key: 'refreshToken', label: 'Refresh Token', summary: this.detail.refreshToken },
    { key: 'authorizationCode', label: 'Authorization Code', summary: this.detail.authorizationCode },
    { key: 'idToken', label: 'ID Token', summary: this.detail.idToken }
  ];

  readonly secretFields: SecretField[] = [{ key: 'state', label: 'State', value: this.detail.state }];

  scopesText(): string {
    return setToLines(this.detail.authorizedScopes) || '—';
  }

  hasTokenBlocks(): boolean {
    return this.tokenBlocks.some(block => !!block.summary?.tokenValue);
  }

  isVisible(key: string): boolean {
    return !!this.visibleKeys()[key];
  }

  toggleVisible(key: string): void {
    this.visibleKeys.update(map => ({ ...map, [key]: !map[key] }));
  }

  displayValue(key: string, value?: string): string {
    if (!value) {
      return '—';
    }
    return this.isVisible(key) ? value : '********';
  }

  formatTime(value?: string): string {
    return value ? new Date(value).toLocaleString() : '—';
  }
}
