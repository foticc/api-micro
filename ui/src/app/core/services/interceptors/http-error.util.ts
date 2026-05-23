import { HttpErrorResponse } from '@angular/common/http';

/** 根据 HTTP 状态码生成用户可读的错误提示 */
export function getHttpErrorMessage(error: HttpErrorResponse): string {
  const status = error.status;
  if (error.error && error.error.msg) {
    return error.error.msg;
  }
  if (status === 0) {
    return '网络出现未知的错误，请检查您的网络。';
  }
  if (status >= 300 && status < 400) {
    return `请求被服务器重定向，状态码为${status}`;
  }
  if (status === 401) {
    return '登录已过期，请重新登录';
  }
  if (status >= 400 && status < 500) {
    return `客户端出错，可能是发送的数据有误，状态码为${status}`;
  }
  if (status >= 500) {
    return `服务器发生错误，状态码为${status}`;
  }
  return error.message || '请求失败';
}
