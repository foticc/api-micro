import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenKey } from '@config/constant';
import { WindowService } from '@core/services/common/window.service';
// 只处理认证
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const windowServe = inject(WindowService);
  const token = windowServe.getSessionStorage(TokenKey);

  if (!token) {
    return next(req);
  }

  const cloneReq = req.clone({
    headers: req.headers.set(TokenKey, token)
  });

  return next(cloneReq);
};
