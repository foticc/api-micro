import { HttpErrorResponse } from '@angular/common/http';

/** 将 OAuth / HTTP 异常转为可读文案，并输出控制台日志 */
export function resolveOAuthErrorMessage(err: unknown, fallback = 'OAuth2 操作失败'): string {
  console.error('[OAuth2]', err);

  if (typeof err === 'string') {
    return mapOAuthErrorCode(err);
  }

  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return '无法连接授权服务器，请检查 IdP 是否启动及 CORS 配置';
    }
    return err.error?.message ?? err.message ?? `授权服务器响应异常（HTTP ${err.status}）`;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  if (err && typeof err === 'object' && 'type' in err) {
    const type = String((err as { type?: string }).type);
    return mapOAuthErrorCode(type);
  }

  return fallback;
}

function mapOAuthErrorCode(code: string): string {
  switch (code) {
    case 'discovery_document_validation_error':
      return 'Discovery 文档校验失败：issuer/endpoint 与配置不一致，请检查 publicBaseUrl 或关闭严格校验';
    case 'discovery_document_load_error':
      return '无法加载 OpenID Discovery 文档，请确认 issuer 地址可访问';
    case 'jwks_load_error':
      return '无法加载 JWKS 公钥';
    default:
      if (code.includes('redirect_uri') || code.includes('REDIRECT_URI')) {
        return 'redirect_uri 与 IdP 注册不一致：请在后端 RegisteredClient 中添加与控制台 [OAuth2] redirect_uri 完全相同的地址（Spring 需字节级匹配，不能带 #）';
      }
      if (code.includes('requireHttps')) {
        return 'HTTP 端点被拦截：请确认 AuthConfig 已通过 provide(AuthConfig) 注入，且 requireHttps 为 false';
      }
      return code;
  }
}
