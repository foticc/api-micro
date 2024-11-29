import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthOauth2Service } from '@core/services/common/auth.oauth2.service';
import { LoginInOutService } from '@core/services/common/login-in-out.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  standalone: true,
  template: ''
})
export class CallbackComponent implements OnInit {
  private auth2Service: AuthOauth2Service = inject(AuthOauth2Service);
  private loginInOutService = inject(LoginInOutService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params && params['code'] && params['state']) {
        this.tryLogin();
      } else {
        this.router.navigateByUrl('default/dashboard/analysis');
      }
    });
  }

  tryLogin(): void {
    this.auth2Service
      .tryLogin()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          if (res) {
            let token = this.auth2Service.accessToken();
            if (token) {
              this.loginInOutService.loginIn(token).then(() => {
                this.router.navigateByUrl('default/dashboard/analysis');
              });
            }
          } else {
            this.router.navigateByUrl('login/login-form');
          }
        },
        error: err => {
          this.router.navigateByUrl('login/login-form');
        }
      });
  }
}
