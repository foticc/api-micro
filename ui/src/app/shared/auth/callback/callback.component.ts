import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthOauth2Service } from '@core/services/common/auth.oauth2.service';

@Component({
  standalone: true,
  template: ''
})
export class CallbackComponent implements OnInit {
  private auth2Service: AuthOauth2Service = inject(AuthOauth2Service);
  private router: Router = inject(Router);

  ngOnInit(): void {
    this.auth2Service.tryLogin().then(
      () => {
        this.router.navigate(['/default']);
      },
      () => {
        this.router.navigate(['/login']);
      }
    );
  }
}
