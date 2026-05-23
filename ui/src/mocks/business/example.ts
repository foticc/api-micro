import { http, HttpResponse } from 'msw';

/** 会话超时演示：返回 HTTP 401，触发登录过期拦截器跳转登录页 */
export const example = [
  http.get('/site/api/sessionTimeOut/', () => {
    return HttpResponse.json({ code: 401, msg: '未认证', data: null }, { status: 401 });
  })
];
