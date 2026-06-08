import { HttpContextToken, HttpContext } from '@angular/common/http';

// 是否需要loading
export const SHOW_LOADING = new HttpContextToken<boolean>(() => false);
// 是否需要"操作成功"提示
export const NEED_SUCCESS_INFO = new HttpContextToken<boolean>(() => false);
// 是否需要解包 ActionResult 响应，第三方库的请求也经过业务处理拦截器
export const NEED_UNWRAP = new HttpContextToken<boolean>(() => false);
// 自定义 Loading 文案
export const LOADING_TEXT = new HttpContextToken<string>(() => '加载中...');

export function buildHttpContext(config?: { needSuccessInfo?: boolean; showLoading?: boolean; loadingText?: string }): HttpContext {
  const context = new HttpContext();

  //是否需要解包 ActionResult 响应，第三方库的请求也经过业务处理拦截器
  context.set(NEED_UNWRAP, true);
  if (config?.showLoading) {
    context.set(SHOW_LOADING, true);
    context.set(LOADING_TEXT, config.loadingText || '加载中...');
  }
  if (config?.needSuccessInfo) {
    context.set(NEED_SUCCESS_INFO, true);
  }
  return context;
}
