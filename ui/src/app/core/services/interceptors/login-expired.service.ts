import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { catchError, filter, finalize, share, switchMap } from 'rxjs/operators';

import { loginTimeOutCode, TokenKey, tokenErrorCode } from '@config/constant';
import { LoginInOutService } from '@core/services/common/login-in-out.service';
import { WindowService } from '@core/services/common/window.service';
import { getHttpErrorMessage } from '@core/services/interceptors/http-error.util';
import { ModalBtnStatus } from '@widget/base-modal';
import { LoginModalService } from '@widget/biz-widget/login/login-modal.service';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({ providedIn: 'root' })
export class LoginExpiredService implements HttpInterceptor {
  private refresher: Observable<HttpEvent<NzSafeAny>> | null = null;
  private isHandlingUnauthorized = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly loginModalService = inject(LoginModalService);
  private readonly loginInOutService = inject(LoginInOutService);
  private readonly message = inject(NzMessageService);
  private readonly windowServe = inject(WindowService);
  private readonly http = inject(HttpClient);

  intercept(req: HttpRequest<NzSafeAny>, next: HttpHandler): Observable<HttpEvent<NzSafeAny>> {
    return next.handle(req).pipe(
      filter(e => e.type !== 0),
      switchMap((event): Observable<HttpEvent<NzSafeAny>> => {
        if (!(event instanceof HttpResponse) || event.body == null || typeof event.body.code !== 'number') {
          return of(event);
        }

        const { code, msg } = event.body as { code: number; msg?: string };

        // 业务码：Token 无效 → 登出并跳转登录页
        if (code === tokenErrorCode) {
          this.message.error(msg || '登录状态无效，请重新登录');
          this.forceLoginOut();
          return EMPTY;
        }

        // 业务码：登录超时 → 弹窗重登并重发请求
        if (code === loginTimeOutCode) {
          return this.handleLoginTimeout(req, next);
        }

        return of(event);
      }),
      catchError((error: NzSafeAny) => {
        if (error instanceof HttpErrorResponse) {
          // HTTP 401：未认证 / Token 过期
          if (error.status === 401) {
            this.handleHttpUnauthorized();
            return throwError(() => ({ code: 401, message: getHttpErrorMessage(error) }));
          }

          const errMsg = getHttpErrorMessage(error);
          this.message.error(errMsg);
          return throwError(() => ({ code: error.status, message: errMsg }));
        }

        return throwError(() => error);
      })
    );
  }

  private handleHttpUnauthorized(): void {
    if (this.isHandlingUnauthorized) {
      return;
    }
    this.isHandlingUnauthorized = true;
    this.message.error('登录已过期，请重新登录');
    void this.loginInOutService.clearSessionAndRedirect().finally(() => {
      this.isHandlingUnauthorized = false;
      this.refresher = null;
    });
  }

  /** Token 无效：仅清本地会话，不请求登出接口 */
  private forceLoginOut(): void {
    this.refresher = null;
    void this.loginInOutService.clearSessionAndRedirect();
  }

  /** 并发请求在弹窗登录成功后，使用新 Token 重发 */
  private sendRequest(request: HttpRequest<NzSafeAny>, next: HttpHandler): Observable<HttpEvent<NzSafeAny>> {
    return this.refresher!.pipe(
      switchMap(() => {
        const token = this.windowServe.getSessionStorage(TokenKey);
        const copyReq = token ? request.clone({ headers: request.headers.set(TokenKey, token) }) : request;
        return next.handle(copyReq);
      }),
      finalize(() => (this.refresher = null))
    );
  }

  /** 业务码 1012：登录超时，弹窗重新登录 */
  private handleLoginTimeout(req: HttpRequest<NzSafeAny>, next: HttpHandler): Observable<HttpEvent<NzSafeAny>> {
    if (this.refresher) {
      return this.sendRequest(req, next);
    }

    this.refresher = new Observable<HttpEvent<NzSafeAny>>(observer => {
      setTimeout(() => {
        this.loginModalService
          .show({ nzTitle: '登录信息过期，重新登录' })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ modalValue: token, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              observer.next(
                new HttpResponse({
                  body: {
                    code: 3013,
                    msg: '取消后请重新登录',
                    data: null
                  }
                })
              );
              this.forceLoginOut();
              observer.complete();
              return;
            }

            void this.loginInOutService.loginIn(token).then(() => {
              this.http
                .request(req)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                  next: data => {
                    this.refresher = null;
                    observer.next(data);
                    observer.complete();
                  },
                  error: () => {
                    this.message.error('您没有权限登录该模块');
                    this.forceLoginOut();
                    observer.error({ code: 403, message: '您没有权限登录该模块' });
                  }
                });
            });
          });
      }, 100);
    }).pipe(
      share(),
      finalize(() => (this.refresher = null))
    );

    return this.refresher;
  }
}
