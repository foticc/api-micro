import type {
  PermissionApi,
  PermissionBindIdsPayload,
  RbacPermission,
  RbacPermissionPageItem,
  RbacPermissionPayload,
  RbacRole,
  RbacRolePageItem,
  RbacRolePayload
} from '@app/pages/system/test/models/rbac.models';
import { http, HttpResponse } from 'msw';

let nextPermId = 100;
let nextRoleId = 10;

function resolveModule(p: { code: string; module?: string }): string {
  if (p.module) {
    return p.module;
  }
  if (p.code === 'all') {
    return 'all';
  }
  const idx = p.code.indexOf(':');
  return idx > 0 ? p.code.slice(0, idx) : p.code;
}

const rawPermissions = [
  {
    id: 1,
    code: 'all',
    name: '所有权限',
    module: 'all',
    menuIds: [1, 8],
    menus: [
      { id: 1, code: 'default:dashboard', menuName: 'Dashboard', menuType: 'C' },
      { id: 8, code: 'default:dashboard:analysis', menuName: '分析页', menuType: 'C' }
    ] as RbacPermission['menus'],
    apis: []
  },
  {
    id: 2,
    code: 'sys:user:list',
    name: '用户列表查询',

    apis: [
      { method: 'GET', path: '/api/users', description: '用户分页列表' },
      { method: 'GET', path: '/api/users/:id', description: '获取用户详情' }
    ]
  },
  {
    id: 17,
    code: 'sys:user:create',
    name: '用户创建',

    apis: [
      { method: 'POST', path: '/api/users', description: '创建用户' },
      { method: 'GET', path: '/api/dept/tree', description: '部门树' }
    ]
  },
  {
    id: 3,
    code: 'sys:user:update',
    name: '用户编辑',

    apis: [
      { method: 'PUT', path: '/api/users/:id', description: '更新用户信息' },
      { method: 'PATCH', path: '/api/users/:id/status', description: '更新用户状态' }
    ]
  },
  {
    id: 4,
    code: 'sys:user:delete',
    name: '用户删除',

    apis: [{ method: 'DELETE', path: '/api/users/:id', description: '删除用户' }]
  },
  {
    id: 5,
    code: 'sys:role:list',
    name: '角色列表查询',

    apis: [
      { method: 'GET', path: '/api/roles', description: '获取角色列表' },
      { method: 'GET', path: '/api/roles/:id', description: '获取角色详情' }
    ]
  },
  {
    id: 6,
    code: 'sys:role:manage',
    name: '角色管理',

    apis: [
      { method: 'POST', path: '/api/roles', description: '创建角色' },
      { method: 'PUT', path: '/api/roles/:id', description: '更新角色' },
      { method: 'DELETE', path: '/api/roles/:id', description: '删除角色' },
      { method: 'POST', path: '/api/roles/:id/permissions', description: '分配权限' }
    ]
  },
  {
    id: 7,
    code: 'sys:menu:list',
    name: '菜单列表查询',

    apis: [
      { method: 'GET', path: '/api/menus', description: '获取菜单列表' },
      { method: 'GET', path: '/api/menus/tree', description: '获取菜单树形结构' }
    ]
  },
  {
    id: 8,
    code: 'sys:menu:manage',
    name: '菜单管理',

    apis: [
      { method: 'POST', path: '/api/menus', description: '创建菜单' },
      { method: 'PUT', path: '/api/menus/:id', description: '更新菜单' },
      { method: 'DELETE', path: '/api/menus/:id', description: '删除菜单' }
    ]
  },
  {
    id: 9,
    code: 'biz:order:list',
    name: '订单列表查询',

    apis: [
      { method: 'GET', path: '/api/orders', description: '获取订单列表' },
      { method: 'GET', path: '/api/orders/:id', description: '获取订单详情' }
    ]
  },
  {
    id: 10,
    code: 'biz:order:create',
    name: '订单创建',

    apis: [{ method: 'POST', path: '/api/orders', description: '创建订单' }]
  },
  {
    id: 11,
    code: 'biz:order:update',
    name: '订单修改',

    apis: [
      { method: 'PUT', path: '/api/orders/:id', description: '更新订单' },
      { method: 'PATCH', path: '/api/orders/:id/status', description: '更新订单状态' }
    ]
  },
  {
    id: 12,
    code: 'biz:order:export',
    name: '订单导出',

    apis: [{ method: 'GET', path: '/api/orders/export', description: '导出订单数据' }]
  },
  {
    id: 13,
    code: 'biz:product:list',
    name: '商品列表查询',

    apis: [
      { method: 'GET', path: '/api/products', description: '获取商品列表' },
      { method: 'GET', path: '/api/products/:id', description: '获取商品详情' }
    ]
  },
  {
    id: 14,
    code: 'biz:product:manage',
    name: '商品管理',

    apis: [
      { method: 'POST', path: '/api/products', description: '创建商品' },
      { method: 'PUT', path: '/api/products/:id', description: '更新商品' },
      { method: 'DELETE', path: '/api/products/:id', description: '删除商品' },
      { method: 'POST', path: '/api/products/:id/stock', description: '库存调整' }
    ]
  },
  {
    id: 15,
    code: 'ana:report:list',
    name: '报表查询',

    apis: [
      { method: 'GET', path: '/api/reports/sales', description: '销售报表' },
      { method: 'GET', path: '/api/reports/users', description: '用户报表' },
      { method: 'GET', path: '/api/reports/orders', description: '订单报表' }
    ]
  },
  {
    id: 16,
    code: 'ana:log:list',
    name: '日志查询',

    apis: [
      { method: 'GET', path: '/api/logs/operation', description: '操作日志' },
      { method: 'GET', path: '/api/logs/access', description: '访问日志' }
    ]
  }
];

const permissions: RbacPermission[] = rawPermissions.map(p => ({
  ...p,
  module: p.module ?? resolveModule(p)
}));

let roles: RbacRole[] = [
  { id: 1, roleName: '超级管理员', roleDesc: '拥有所有权限', permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
  { id: 2, roleName: '系统管理员', roleDesc: '管理系统配置', permissionIds: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 3, roleName: '业务管理员', roleDesc: '管理业务数据', permissionIds: [9, 10, 11, 12, 13, 14] },
  { id: 4, roleName: '数据分析师', roleDesc: '查看报表数据', permissionIds: [9, 13, 15, 16] },
  { id: 5, roleName: '普通用户', roleDesc: '基础操作权限', permissionIds: [1, 9, 13] }
];

function toRolePageItem(r: RbacRole): RbacRolePageItem {
  return {
    id: r.id,
    roleName: r.roleName,
    roleDesc: r.roleDesc,
    permissionCount: r.permissionIds.length
  };
}

function filterRoles(keyword?: string): RbacRole[] {
  const k = (keyword ?? '').trim().toLowerCase();
  if (!k) {
    return [...roles];
  }
  return roles.filter(r => r.roleName.toLowerCase().includes(k) || (r.roleDesc && r.roleDesc.toLowerCase().includes(k)));
}

function filterList(keyword?: string): RbacPermission[] {
  const k = (keyword ?? '').trim().toLowerCase();
  if (!k) {
    return [...permissions];
  }
  return permissions.filter(
    p =>
      p.name.toLowerCase().includes(k) ||
      p.code.toLowerCase().includes(k) ||
      resolveModule(p).toLowerCase().includes(k) ||
      (p.apis && p.apis.some(api => api.path.toLowerCase().includes(k))) ||
      p.menus?.some(m => {
        const name = String(m.name ?? m['menuName'] ?? '');
        const code = String(m.code ?? '');
        return name.toLowerCase().includes(k) || code.toLowerCase().includes(k);
      })
  );
}

function toPageItem(p: RbacPermission): RbacPermissionPageItem {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    module: resolveModule(p),
    menuCount: p.menus?.length ?? p.menuIds?.length ?? 0,
    apiCount: p.apis?.length ?? p.apiIds?.length ?? 0
  };
}

function permissionDetail(p: RbacPermission): RbacPermission {
  const apiIds = (p.apis ?? []).map(a => a.id).filter((id): id is number => id != null);
  const menuIds = p.menuIds ?? p.menus?.map(m => Number(m.id)).filter(id => !Number.isNaN(id)) ?? [];
  return {
    ...p,
    module: p.module ?? resolveModule(p),
    menuIds,
    apiIds
  };
}

function permissionBaseFromPayload(id: number, body: RbacPermissionPayload, prev?: RbacPermission): RbacPermission {
  return {
    id,
    code: body.code,
    name: body.name,
    module: body.module,
    description: body.description,
    menuIds: prev?.menuIds ?? [],
    menus: prev?.menus ?? [],
    apis: prev?.apis ?? [],
    apiIds: prev?.apiIds
  };
}

const API_CATALOG: PermissionApi[] = [
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

function resolveApisByIds(ids: number[], prevApis: PermissionApi[] = []): PermissionApi[] {
  const prevById = new Map(prevApis.filter(a => a.id != null).map(a => [a.id!, a]));
  const prevByPath = new Map(prevApis.map(a => [`${a.method}:${a.path}`, a]));
  const catalogById = new Map(API_CATALOG.filter(a => a.id != null).map(a => [a.id!, a]));

  return ids.map(apiId => {
    if (catalogById.has(apiId)) {
      return catalogById.get(apiId)!;
    }
    if (prevById.has(apiId)) {
      return prevById.get(apiId)!;
    }
    const fallback = [...prevByPath.values()][apiId % Math.max(prevByPath.size, 1)];
    if (fallback) {
      return { ...fallback, id: apiId };
    }
    return { id: apiId, method: 'GET', path: `/api/unknown/${apiId}`, description: '' };
  });
}

function resolveMenusByIds(ids: number[], prevMenus: RbacPermission['menus'] = []): RbacPermission['menus'] {
  const prevById = new Map((prevMenus ?? []).map(m => [Number(m.id), m]));
  return ids.map(id => {
    const prev = prevById.get(id);
    if (prev) {
      return prev;
    }
    return { id, code: `menu:${id}`, menuName: `菜单 #${id}`, menuType: 'C' };
  });
}

export const rbacTest = [
  http.post('/site/api/rbac/permissions/list', async ({ request }) => {
    const body = (await request.json()) as { keyword?: string };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: filterList(body.keyword) });
  }),

  http.post('/site/api/rbac/permissions/page', async ({ request }) => {
    const body = (await request.json()) as { pageIndex: number; pageSize: number; filters?: { keyword?: string } };
    const list = filterList(body.filters?.keyword);
    const total = list.length;
    const start = (body.pageIndex - 1) * body.pageSize;
    return HttpResponse.json({
      code: 200,
      msg: 'SUCCESS',
      data: {
        total,
        pageSize: body.pageSize,
        pageIndex: body.pageIndex,
        list: list.slice(start, start + body.pageSize).map(toPageItem)
      }
    });
  }),

  http.get('/site/api/rbac/permissions/:id', ({ params }) => {
    const id = Number(params['id']);
    const item = permissions.find(p => p.id === id);
    if (!item) {
      return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
    }
    return HttpResponse.json({
      code: 200,
      msg: 'SUCCESS',
      data: permissionDetail(item)
    });
  }),

  http.post('/site/api/rbac/permissions', async ({ request }) => {
    const body = (await request.json()) as RbacPermissionPayload;
    if (permissions.some(p => p.code === body.code)) {
      return HttpResponse.json({ code: 400, msg: '权限编码已存在', data: null }, { status: 200 });
    }
    const item = permissionBaseFromPayload(nextPermId++, body);
    permissions.push(item);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: permissionDetail(item) });
  }),

  http.put('/site/api/rbac/permissions/:id', async ({ request, params }) => {
    const id = Number(params['id']);
    const body = (await request.json()) as RbacPermissionPayload;
    const idx = permissions.findIndex(p => p.id === id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, msg: '权限不存在', data: null });
    }
    if (permissions.some(p => p.code === body.code && p.id !== id)) {
      return HttpResponse.json({ code: 400, msg: '权限编码已存在', data: null }, { status: 200 });
    }
    permissions[idx] = permissionBaseFromPayload(id, body, permissions[idx]);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: permissionDetail(permissions[idx]) });
  }),

  http.get('/site/api/rbac/permissions/:id/menus', ({ params }) => {
    const id = Number(params['id']);
    const item = permissions.find(p => p.id === id);
    if (!item) {
      return HttpResponse.json({ code: 404, msg: '权限不存在', data: null }, { status: 404 });
    }
    const ids = item.menuIds ?? item.menus?.map(m => Number(m.id)).filter(menuId => !Number.isNaN(menuId)) ?? [];
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: { ids } });
  }),

  http.get('/site/api/rbac/permissions/:id/apis', ({ params }) => {
    const id = Number(params['id']);
    const item = permissions.find(p => p.id === id);
    if (!item) {
      return HttpResponse.json({ code: 404, msg: '权限不存在', data: null }, { status: 404 });
    }
    const ids = item.apiIds ?? item.apis?.map(a => a.id).filter((apiId): apiId is number => apiId != null) ?? [];
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: { ids } });
  }),

  http.put('/site/api/rbac/permissions/:id/apis', async ({ request, params }) => {
    const id = Number(params['id']);
    const { ids } = (await request.json()) as PermissionBindIdsPayload;
    const idx = permissions.findIndex(p => p.id === id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, msg: '权限不存在', data: null });
    }
    const prev = permissions[idx];
    const apis = resolveApisByIds(ids ?? [], prev.apis ?? []);
    permissions[idx] = { ...prev, apis, apiIds: ids ?? [] };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: permissionDetail(permissions[idx]) });
  }),

  http.put('/site/api/rbac/permissions/:id/menus', async ({ request, params }) => {
    const id = Number(params['id']);
    const { ids } = (await request.json()) as PermissionBindIdsPayload;
    const idx = permissions.findIndex(p => p.id === id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, msg: '权限不存在', data: null });
    }
    const prev = permissions[idx];
    const menuIds = ids ?? [];
    const menus = resolveMenusByIds(menuIds, prev.menus);
    permissions[idx] = { ...prev, menuIds, menus };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: permissionDetail(permissions[idx]) });
  }),

  http.post('/site/api/rbac/permissions/del', async ({ request }) => {
    const { ids } = (await request.json()) as { ids: number[] };
    ids.forEach(id => {
      const idx = permissions.findIndex(p => p.id === id);
      if (idx !== -1) {
        permissions.splice(idx, 1);
        roles = roles.map(r => ({ ...r, permissionIds: r.permissionIds.filter(pid => pid !== id) }));
      }
    });
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/rbac/roles/list', async ({ request }) => {
    const body = ((await request.json().catch(() => ({}))) ?? {}) as { filters?: { keyword?: string } };
    const list = filterRoles(body.filters?.keyword);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: list });
  }),

  http.get('/site/api/rbac/roles', () => {
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: roles });
  }),

  http.post('/site/api/rbac/roles/page', async ({ request }) => {
    const body = (await request.json()) as { pageIndex: number; pageSize: number; filters?: { keyword?: string } };
    const list = filterRoles(body.filters?.keyword);
    const total = list.length;
    const start = (body.pageIndex - 1) * body.pageSize;
    return HttpResponse.json({
      code: 200,
      msg: 'SUCCESS',
      data: {
        total,
        pageSize: body.pageSize,
        pageIndex: body.pageIndex,
        list: list.slice(start, start + body.pageSize).map(toRolePageItem)
      }
    });
  }),

  http.get('/site/api/rbac/roles/:id', ({ params }) => {
    const item = roles.find(r => r.id === Number(params['id']));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),

  http.post('/site/api/rbac/roles', async ({ request }) => {
    const body = (await request.json()) as RbacRolePayload;
    if (roles.some(r => r.roleName === body.roleName)) {
      return HttpResponse.json({ code: 400, msg: '角色名称已存在', data: null }, { status: 200 });
    }
    const item: RbacRole = {
      id: nextRoleId++,
      roleName: body.roleName,
      roleDesc: body.roleDesc ?? '',
      permissionIds: []
    };
    roles.push(item);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item });
  }),

  http.put('/site/api/rbac/roles/:id', async ({ request, params }) => {
    const id = Number(params['id']);
    const body = (await request.json()) as RbacRolePayload;
    const idx = roles.findIndex(r => r.id === id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, msg: '角色不存在', data: null });
    }
    if (roles.some(r => r.roleName === body.roleName && r.id !== id)) {
      return HttpResponse.json({ code: 400, msg: '角色名称已存在', data: null }, { status: 200 });
    }
    roles[idx] = { ...roles[idx], roleName: body.roleName, roleDesc: body.roleDesc ?? '' };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: roles[idx] });
  }),

  http.post('/site/api/rbac/roles/del', async ({ request }) => {
    const { ids } = (await request.json()) as { ids: number[] };
    ids.forEach(id => {
      const idx = roles.findIndex(r => r.id === id);
      if (idx !== -1) {
        roles.splice(idx, 1);
      }
    });
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/rbac/roles/:roleId/permissions', async ({ request, params }) => {
    const roleId = Number(params['roleId']);
    const { permissionIds } = (await request.json()) as { permissionIds: number[] };
    const idx = roles.findIndex(r => r.id === roleId);
    if (idx !== -1) {
      roles[idx] = { ...roles[idx], permissionIds: [...permissionIds] };
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/rbac/permissions/preview-apis', async ({ request }) => {
    const { permissionIds } = (await request.json()) as { permissionIds: number[] };
    const list = permissions.filter(p => permissionIds.includes(p.id)).flatMap(p => p.apis);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: { total: list.length, list } });
  })
];
