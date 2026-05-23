import { http, HttpResponse } from 'msw';

import type { RbacPermission, RbacPermissionPayload, RbacRole } from '@app/pages/system/test/models/rbac.models';

interface StructureTreeNode {
  key: string;
  title: string;
  type: 'module' | 'permission' | 'api';
  permissionId?: number;
  children?: StructureTreeNode[];
}

function buildStructureTree(permissions: RbacPermission[]): StructureTreeNode[] {
  return permissions.map(p => ({
    key: `perm:${p.id}`,
    title: `${p.name} [${p.code}]`,
    type: 'permission',
    permissionId: p.id,
    children: (p.apis || []).map(api => ({
      key: `api:${p.id}:${api.path}`,
      title: `${api.method} ${api.path}`,
      type: 'api'
    }))
  }));
}

let nextPermId = 100;
let nextRoleId = 10;

const permissions: RbacPermission[] = [
  {
    id: 1,
    code: 'sys:user:list',
    name: '用户列表查询',

    apis: [
      { method: 'GET', path: '/api/users', description: '用户分页列表' },
      { method: 'GET', path: '/api/users/:id', description: '获取用户详情' }
    ]
  },
  {
    id: 2,
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

    apis: [
      { method: 'DELETE', path: '/api/users/:id', description: '删除用户' }
    ]
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

    apis: [
      { method: 'POST', path: '/api/orders', description: '创建订单' }
    ]
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

    apis: [
      { method: 'GET', path: '/api/orders/export', description: '导出订单数据' }
    ]
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

let roles: RbacRole[] = [
  { id: 1, roleName: '超级管理员', roleDesc: '拥有所有权限', permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
  { id: 2, roleName: '系统管理员', roleDesc: '管理系统配置', permissionIds: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 3, roleName: '业务管理员', roleDesc: '管理业务数据', permissionIds: [9, 10, 11, 12, 13, 14] },
  { id: 4, roleName: '数据分析师', roleDesc: '查看报表数据', permissionIds: [9, 13, 15, 16] },
  { id: 5, roleName: '普通用户', roleDesc: '基础操作权限', permissionIds: [1, 9, 13] }
];

function filterList(keyword?: string): RbacPermission[] {
  const k = (keyword ?? '').trim().toLowerCase();
  if (!k) {
    return [...permissions];
  }
  return permissions.filter(
    p =>
      p.name.toLowerCase().includes(k) ||
      p.code.toLowerCase().includes(k) ||
      (p.apis && p.apis.some(api => api.path.toLowerCase().includes(k))) ||
      p.menus?.some(m => m.name.toLowerCase().includes(k) || m.code.toLowerCase().includes(k))
  );
}

export const rbacTest = [
  http.post('/site/api/rbac-test/permissions/list', async ({ request }) => {
    const body = (await request.json()) as { keyword?: string };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: filterList(body.keyword) });
  }),

  http.post('/site/api/rbac-test/permissions/page', async ({ request }) => {
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
        list: list.slice(start, start + body.pageSize)
      }
    });
  }),

  http.get('/site/api/rbac-test/permissions/:id', ({ params }) => {
    const item = permissions.find(p => p.id === Number(params['id']));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),

  http.post('/site/api/rbac-test/permissions', async ({ request }) => {
    const body = (await request.json()) as RbacPermissionPayload;
    if (permissions.some(p => p.code === body.code)) {
      return HttpResponse.json({ code: 400, msg: '权限编码已存在', data: null }, { status: 200 });
    }
    const item: RbacPermission = { id: nextPermId++, ...body };
    permissions.push(item);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item });
  }),

  http.put('/site/api/rbac-test/permissions/:id', async ({ request, params }) => {
    const id = Number(params['id']);
    const body = (await request.json()) as RbacPermissionPayload;
    const idx = permissions.findIndex(p => p.id === id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, msg: '权限不存在', data: null });
    }
    if (permissions.some(p => p.code === body.code && p.id !== id)) {
      return HttpResponse.json({ code: 400, msg: '权限编码已存在', data: null }, { status: 200 });
    }
    permissions[idx] = { id, ...body };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: permissions[idx] });
  }),

  http.delete('/site/api/rbac-test/permissions/:id', ({ params }) => {
    const id = Number(params['id']);
    const idx = permissions.findIndex(p => p.id === id);
    if (idx !== -1) {
      permissions.splice(idx, 1);
      roles = roles.map(r => ({ ...r, permissionIds: r.permissionIds.filter(pid => pid !== id) }));
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.get('/site/api/rbac-test/menu-structure', () => {
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: buildStructureTree(permissions) });
  }),

  http.get('/site/api/rbac-test/roles', () => {
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: roles });
  }),

  http.get('/site/api/rbac-test/roles/:id', ({ params }) => {
    const item = roles.find(r => r.id === Number(params['id']));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),

  http.post('/site/api/rbac-test/roles/:roleId/permissions', async ({ request, params }) => {
    const roleId = Number(params['roleId']);
    const { permissionIds } = (await request.json()) as { permissionIds: number[] };
    const idx = roles.findIndex(r => r.id === roleId);
    if (idx !== -1) {
      roles[idx] = { ...roles[idx], permissionIds: [...permissionIds] };
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/rbac-test/permissions/preview-apis', async ({ request }) => {
    const { permissionIds } = (await request.json()) as { permissionIds: number[] };
    const list = permissions.filter(p => permissionIds.includes(p.id)).flatMap(p => p.apis);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: { total: list.length, list } });
  })
];
