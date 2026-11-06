import { http, HttpResponse } from 'msw';

interface ApiPermissionRef {
  id: number;
  name: string;
}

interface ApiResourceRow {
  id: number;
  method: string;
  path: string;
  description?: string;
  module?: string;
  name?: string;
  source?: string;
  status?: string;
  permissions?: ApiPermissionRef[];
}

const FALLBACK_MODULE = '其他';

function moduleOf(path: string): string {
  for (const segment of path.split('/')) {
    if (segment) {
      return segment;
    }
  }
  return FALLBACK_MODULE;
}

let resources: ApiResourceRow[] = [
  { id: 1, method: 'GET', path: '/api/users', description: '获取用户列表', name: 'listUsers', source: 'SCAN', status: 'ACTIVE', permissions: [{ id: 1, name: '用户查询' }] },
  { id: 2, method: 'GET', path: '/api/users/:id', description: '获取用户详情', name: 'getUser', source: 'SCAN', status: 'ACTIVE' },
  { id: 3, method: 'POST', path: '/api/users', description: '创建用户', name: 'createUser', source: 'SCAN', status: 'ACTIVE' },
  { id: 4, method: 'PUT', path: '/api/users/:id', description: '更新用户信息', name: 'updateUser', source: 'SCAN', status: 'ACTIVE' },
  { id: 5, method: 'DELETE', path: '/api/users/:id', description: '删除用户', name: 'deleteUser', source: 'SCAN', status: 'ACTIVE' },
  { id: 6, method: 'GET', path: '/api/roles', description: '获取角色列表', name: 'listRoles', source: 'SCAN', status: 'ACTIVE' },
  { id: 7, method: 'GET', path: '/api/roles/:id', description: '获取角色详情', name: 'getRole', source: 'SCAN', status: 'ACTIVE' },
  { id: 8, method: 'POST', path: '/api/roles', description: '创建角色', name: 'createRole', source: 'SCAN', status: 'ACTIVE' },
  { id: 9, method: 'PUT', path: '/api/roles/:id', description: '更新角色', name: 'updateRole', source: 'SCAN', status: 'ACTIVE' },
  { id: 10, method: 'DELETE', path: '/api/roles/:id', description: '删除角色', name: 'deleteRole', source: 'SCAN', status: 'ACTIVE' },
  { id: 11, method: 'GET', path: '/api/menus', description: '获取菜单列表', name: 'listMenus', source: 'SCAN', status: 'ACTIVE' },
  { id: 12, method: 'GET', path: '/api/menus/tree', description: '获取菜单树形结构', name: 'menuTree', source: 'SCAN', status: 'ACTIVE' },
  { id: 13, method: 'POST', path: '/api/menus', description: '创建菜单', name: 'createMenu', source: 'SCAN', status: 'ACTIVE' },
  { id: 14, method: 'PUT', path: '/api/menus/:id', description: '更新菜单', name: 'updateMenu', source: 'SCAN', status: 'ACTIVE' },
  { id: 15, method: 'DELETE', path: '/api/menus/:id', description: '删除菜单', name: 'deleteMenu', source: 'SCAN', status: 'ACTIVE' },
  { id: 16, method: 'GET', path: '/api/orders', description: '获取订单列表', name: 'listOrders', source: 'SCAN', status: 'ACTIVE' },
  { id: 17, method: 'GET', path: '/api/orders/:id', description: '获取订单详情', name: 'getOrder', source: 'SCAN', status: 'ACTIVE' },
  { id: 18, method: 'POST', path: '/api/orders', description: '创建订单', name: 'createOrder', source: 'MANUAL', status: 'ACTIVE' },
  { id: 19, method: 'PUT', path: '/api/orders/:id', description: '更新订单', name: 'updateOrder', source: 'SCAN', status: 'ACTIVE' },
  { id: 20, method: 'GET', path: '/api/products', description: '获取商品列表', name: 'listProducts', source: 'SCAN', status: 'ACTIVE' },
  { id: 21, method: 'GET', path: '/api/products/:id', description: '获取商品详情', name: 'getProduct', source: 'SCAN', status: 'ACTIVE' },
  { id: 22, method: 'POST', path: '/api/products', description: '创建商品', name: 'createProduct', source: 'SCAN', status: 'ACTIVE' },
  { id: 23, method: 'PUT', path: '/api/products/:id', description: '更新商品', name: 'updateProduct', source: 'SCAN', status: 'ACTIVE' },
  { id: 24, method: 'DELETE', path: '/api/products/:id', description: '删除商品', name: 'deleteProduct', source: 'SCAN', status: 'ACTIVE' },
  { id: 25, method: 'GET', path: '/api/reports/sales', description: '销售报表', name: 'salesReport', source: 'SCAN', status: 'ACTIVE' },
  { id: 26, method: 'GET', path: '/api/reports/users', description: '用户报表', name: 'userReport', source: 'SCAN', status: 'ACTIVE' },
  { id: 27, method: 'GET', path: '/api/logs/operation', description: '操作日志', name: 'operationLog', source: 'SCAN', status: 'ACTIVE' },
  { id: 28, method: 'GET', path: '/api/logs/access', name: 'accessLog', source: 'SCAN', status: 'STALE' }
].map(row => ({ ...row, module: moduleOf(row.path) }));

let nextId = 29;

function withCount(row: ApiResourceRow): ApiResourceRow & { permissionCount: number } {
  const permissions = row.permissions ?? [];
  return { ...row, permissions, permissionCount: permissions.length };
}

function pageSlice<T>(list: T[], pageIndex: number, pageSize: number) {
  const total = list.length;
  const start = (pageIndex - 1) * pageSize;
  return { total, pageSize, pageIndex, list: list.slice(start, start + pageSize) };
}

function duplicate(row: Omit<ApiResourceRow, 'id'>, excludeId?: number): boolean {
  return resources.some(item => item.method === row.method && item.path === row.path && item.id !== excludeId);
}

function filterResources(filters?: {
  keyword?: string;
  method?: string;
  module?: string;
  status?: string;
  unbound?: boolean;
  missingDescription?: boolean;
}): ApiResourceRow[] {
  let list = resources.map(withCount);
  const kw = filters?.keyword?.trim().toLowerCase();
  if (kw) {
    list = list.filter(
      item =>
        item.path.toLowerCase().includes(kw) ||
        (item.description?.toLowerCase().includes(kw) ?? false) ||
        (item.name?.toLowerCase().includes(kw) ?? false)
    );
  }
  if (filters?.method) {
    list = list.filter(item => item.method === filters.method);
  }
  if (filters?.module) {
    list = list.filter(item => item.module === filters.module);
  }
  if (filters?.status) {
    list = list.filter(item => item.status === filters.status);
  }
  if (filters?.unbound) {
    list = list.filter(item => (item.permissions?.length ?? 0) === 0);
  }
  if (filters?.missingDescription) {
    list = list.filter(item => !item.description?.trim());
  }
  return list;
}

function moduleSummary() {
  const counts = new Map<string, number>();
  for (const item of resources) {
    const module = item.module || FALLBACK_MODULE;
    counts.set(module, (counts.get(module) ?? 0) + 1);
  }
  return {
    total: resources.length,
    staleCount: resources.filter(item => item.status === 'STALE').length,
    modules: [...counts.entries()].map(([module, count]) => ({ module, count })).sort((a, b) => a.module.localeCompare(b.module))
  };
}

function ok(data: unknown) {
  return HttpResponse.json({ code: 200, msg: 'SUCCESS', data });
}

const prefixes = ['/site/api/api-resource', '/site/api/api/resource'];

export const apiResource = prefixes.flatMap(prefix => [
  http.post(`${prefix}/page`, async ({ request }) => {
    const body = (await request.json()) as {
      pageIndex: number;
      pageSize: number;
      filters?: {
        keyword?: string;
        method?: string;
        module?: string;
        status?: string;
        unbound?: boolean;
        missingDescription?: boolean;
      };
    };
    const { pageIndex, pageSize, filters } = body;
    return ok(pageSlice(filterResources(filters), pageIndex, pageSize));
  }),

  http.post(`${prefix}/modules`, () => ok(moduleSummary())),

  http.post(`${prefix}/list`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      filters?: {
        keyword?: string;
        method?: string;
        module?: string;
        status?: string;
        unbound?: boolean;
        missingDescription?: boolean;
      };
    };
    return ok(filterResources(body?.filters));
  }),

  http.get(`${prefix}/:id`, ({ params }) => {
    const id = Number(params['id']);
    const item = resources.find(row => row.id === id);
    return ok(item ? withCount(item) : null);
  }),

  http.post(`${prefix}/create`, async ({ request }) => {
    const body = (await request.json()) as Omit<ApiResourceRow, 'id'>;
    if (duplicate(body)) {
      return HttpResponse.json({ code: 400, msg: '相同路径和方法的 API 已存在', data: null }, { status: 200 });
    }
    const row: ApiResourceRow = {
      ...body,
      id: nextId++,
      module: moduleOf(body.path),
      source: 'MANUAL',
      status: 'ACTIVE',
      permissions: []
    };
    resources.push(row);
    return ok(null);
  }),

  http.put(`${prefix}/:id`, async ({ request, params }) => {
    const id = Number(params['id']);
    const body = (await request.json()) as Omit<ApiResourceRow, 'id'>;
    const idx = resources.findIndex(row => row.id === id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, msg: 'API 不存在', data: null }, { status: 200 });
    }
    const current = resources[idx];
    if (current.source === 'SCAN' && (body.method !== current.method || body.path !== current.path)) {
      return HttpResponse.json({ code: 400, msg: '扫描登记的接口不能修改请求方法或路径', data: null }, { status: 200 });
    }
    if (duplicate(body, id)) {
      return HttpResponse.json({ code: 400, msg: '相同路径和方法的 API 已存在', data: null }, { status: 200 });
    }
    resources[idx] = {
      ...current,
      ...body,
      module: moduleOf(body.path || current.path),
      source: current.source,
      status: current.status
    };
    return ok(withCount(resources[idx]));
  }),

  http.post(`${prefix}/del`, async ({ request }) => {
    const { ids } = (await request.json()) as { ids: number[] };
    resources = resources.filter(row => !ids.includes(row.id));
    return ok(null);
  })
]);
