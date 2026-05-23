import { HttpHeaders, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { filter } from 'rxjs/operators';

import { TokenKey } from '@config/constant';
import { WindowService } from '@core/services/common/window.service';

interface CustomHttpConfig {
  headers?: HttpHeaders;
}

/** 注入 Token；HTTP / 业务错误码由 login-expired 拦截器统一处理 */
export const httpInterceptorService: HttpInterceptorFn = (req, next) => {
  const windowServe = inject(WindowService);
  const token = windowServe.getSessionStorage(TokenKey);
  let httpConfig: CustomHttpConfig = {};
  if (token) {
    httpConfig = { headers: req.headers.set(TokenKey, token) };
  }
  const copyReq = req.clone(httpConfig);
  return next(copyReq).pipe(filter(e => e.type !== 0));
};
