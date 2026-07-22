import { http, HttpResponse } from 'msw';

interface ApiResourceRow {
  id: number;
  method: string;
  path: string;
  description?: string;
}

let resources: ApiResourceRow[] = [
  { id: 1, method: 'GET', path: '/api/users', description: '获取用户列表' },
  { id: 2, method: 'GET', path: '/api/users/:id', description: '获取用户详情' },
  { id: 3, method: 'POST', path: '/api/users', description: '创建用户' },
  { id: 4, method: 'PUT', path: '/api/users/:id', description: '更新用户信息' },
  { id: 5, method: 'DELETE', path: '/api/users/:id', description: '删除用户' },
  { id: 6, method: 'GET', path: '/api/roles', description: '获取角色列表' },
  { id: 7, method: 'GET', path: '/api/roles/:id', description: '获取角色详情' },
  { id: 8, method: 'POST', path: '/api/roles', description: '创建角色' },
  { id: 9, method: 'PUT', path: '/api/roles/:id', description: '更新角色' },
  { id: 10, method: 'DELETE', path: '/api/roles/:id', description: '删除角色' },
  { id: 11, method: 'GET', path: '/api/menus', description: '获取菜单列表' },
  { id: 12, method: 'GET', path: '/api/menus/tree', description: '获取菜单树形结构' },
  { id: 13, method: 'POST', path: '/api/menus', description: '创建菜单' },
  { id: 14, method: 'PUT', path: '/api/menus/:id', description: '更新菜单' },
  { id: 15, method: 'DELETE', path: '/api/menus/:id', description: '删除菜单' },
  { id: 16, method: 'GET', path: '/api/orders', description: '获取订单列表' },
  { id: 17, method: 'GET', path: '/api/orders/:id', description: '获取订单详情' },
  { id: 18, method: 'POST', path: '/api/orders', description: '创建订单' },
  { id: 19, method: 'PUT', path: '/api/orders/:id', description: '更新订单' },
  { id: 20, method: 'GET', path: '/api/products', description: '获取商品列表' },
  { id: 21, method: 'GET', path: '/api/products/:id', description: '获取商品详情' },
  { id: 22, method: 'POST', path: '/api/products', description: '创建商品' },
  { id: 23, method: 'PUT', path: '/api/products/:id', description: '更新商品' },
  { id: 24, method: 'DELETE', path: '/api/products/:id', description: '删除商品' },
  { id: 25, method: 'GET', path: '/api/reports/sales', description: '销售报表' },
  { id: 26, method: 'GET', path: '/api/reports/users', description: '用户报表' },
  { id: 27, method: 'GET', path: '/api/logs/operation', description: '操作日志' },
  { id: 28, method: 'GET', path: '/api/logs/access', description: '访问日志' }
];

let nextId = 29;

function pageSlice<T>(list: T[], pageIndex: number, pageSize: number) {
  const total = list.length;
  const start = (pageIndex - 1) * pageSize;
  return { total, pageSize, pageIndex, list: list.slice(start, start + pageSize) };
}

function duplicate(row: Omit<ApiResourceRow, 'id'>, excludeId?: number): boolean {
  return resources.some(r => r.method === row.method && r.path === row.path && r.id !== excludeId);
}

export const apiResource = [
  http.post('/site/api/api-resource/page', async ({ request }) => {
    const body = (await request.json()) as {
      pageIndex: number;
      pageSize: number;
      filters?: { keyword?: string; method?: string };
    };
    const { pageIndex, pageSize, filters } = body;
    let list = [...resources];
    const kw = filters?.keyword?.trim().toLowerCase();
    if (kw) {
      list = list.filter(r => r.path.toLowerCase().includes(kw) || (r.description?.toLowerCase().includes(kw) ?? false));
    }
    if (filters?.method) {
      list = list.filter(r => r.method === filters.method);
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: pageSlice(list, pageIndex, pageSize) });
  }),

  http.get('/site/api/api-resource/:id', ({ params }) => {
    const id = Number(params['id']);
    const item = resources.find(r => r.id === id);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),

  http.post('/site/api/api-resource/create', async ({ request }) => {
    const body = (await request.json()) as Omit<ApiResourceRow, 'id'>;
    if (duplicate(body)) {
      return HttpResponse.json({ code: 400, msg: '相同路径和方法的 API 已存在', data: null }, { status: 200 });
    }
    const row: ApiResourceRow = { ...body, id: nextId++ };
    resources.push(row);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.put('/site/api/api/resource/:id', async ({ request, params }) => {
    const id = Number(params['id']);
    const body = (await request.json()) as Omit<ApiResourceRow, 'id'>;
    if (duplicate(body, id)) {
      return HttpResponse.json({ code: 400, msg: '相同路径和方法的 API 已存在', data: null }, { status: 200 });
    }
    const idx = resources.findIndex(r => r.id === id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, msg: 'API 不存在', data: null }, { status: 200 });
    }
    resources[idx] = { ...resources[idx], ...body };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: resources[idx] });
  }),

  http.post('/site/api/api-resource/del', async ({ request }) => {
    const { ids } = (await request.json()) as { ids: number[] };
    resources = resources.filter(r => !ids.includes(r.id));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  })
];
