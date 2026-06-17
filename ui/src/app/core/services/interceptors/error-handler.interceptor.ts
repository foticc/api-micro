import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { LoginInOutService } from '@core/services/common/login-in-out.service';
import { ActionResult } from '@core/services/http/http-types';
import { getHttpErrorMessage } from '@core/services/interceptors/http-error.util';

import { NzMessageService } from 'ng-zorro-antd/message';

let isHandlingUnauthorized = false;

function handleHttpUnauthorized(message: NzMessageService, loginInOutService: LoginInOutService): void {
  if (isHandlingUnauthorized) {
    return;
  }
  isHandlingUnauthorized = true;
  message.error('登录已过期，请重新登录');
  void loginInOutService.clearSessionAndRedirect().finally(() => {
    isHandlingUnauthorized = false;
  });
}

function handleHttpError(
  error: HttpErrorResponse,
  message: NzMessageService,
  loginInOutService: LoginInOutService
): Observable<never> {
  if (error.status === 401) {
    handleHttpUnauthorized(message, loginInOutService);
    const errMsg = getHttpErrorMessage(error);
    return throwError(() => ({ code: 401, msg: errMsg, data: null }) satisfies ActionResult<null>);
  }

  const errMsg = getHttpErrorMessage(error);
  message.error(errMsg);
  return throwError(() => ({ code: error.status, msg: errMsg, data: null }) satisfies ActionResult<null>);
}

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const message = inject(NzMessageService);
  const loginInOutService = inject(LoginInOutService);

  return next(req).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse) {
        return handleHttpError(error, message, loginInOutService);
      }
      return throwError(() => error);
    })
  );
};
