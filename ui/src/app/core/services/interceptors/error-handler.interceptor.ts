import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ActionResult } from '@core/services/http/http-types';

// 只处理 HTTP 错误
function handleHttpError(error: HttpErrorResponse): Observable<never> {
  const status = error.status;
  let errMsg = '';
  if (status === 0) {
    errMsg = '网络出现未知的错误，请检查您的网络。';
  }
  if (status >= 300 && status < 400) {
    errMsg = `请求被服务器重定向，状态码为${status}`;
  }
  if (status >= 400 && status < 500) {
    errMsg = `客户端出错，可能是发送的数据有误，状态码为${status}`;
  }
  if (status >= 500) {
    errMsg = `服务器发生错误，状态码为${status}`;
  }

  return throwError(() => ({ code: status, msg: errMsg, data: null }) satisfies ActionResult<null>);
}

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse) {
        return handleHttpError(error);
      }
      return throwError(() => error);
    })
  );
};
