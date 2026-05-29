import { RbacPermission, RbacRole } from './rbac.models';

function moduleFromCode(code: string): string {
  if (code === 'all') {
    return 'all';
  }
  const idx = code.indexOf(':');
  return idx > 0 ? code.slice(0, idx) : code;
}

export const mockMenus = [
  { id: 101, code: 'sys:user', name: '用户管理', type: 'menu' as const },
  { id: 102, code: 'sys:role', name: '角色管理', type: 'menu' as const },
  { id: 103, code: 'sys:menu', name: '菜单管理', type: 'menu' as const },
  { id: 104, code: 'biz:order', name: '订单管理', type: 'menu' as const },
  { id: 105, code: 'biz:product', name: '商品管理', type: 'menu' as const },
  { id: 106, code: 'ana:report', name: '数据分析', type: 'menu' as const },
  { id: 201, code: 'btn:user:add', name: '新增用户', type: 'button' as const },
  { id: 202, code: 'btn:user:edit', name: '编辑用户', type: 'button' as const },
  { id: 203, code: 'btn:user:delete', name: '删除用户', type: 'button' as const },
  { id: 204, code: 'btn:user:export', name: '导出用户', type: 'button' as const },
  { id: 205, code: 'btn:role:add', name: '新增角色', type: 'button' as const },
  { id: 206, code: 'btn:role:edit', name: '编辑角色', type: 'button' as const },
  { id: 207, code: 'btn:role:delete', name: '删除角色', type: 'button' as const },
  { id: 208, code: 'btn:order:add', name: '新增订单', type: 'button' as const },
  { id: 209, code: 'btn:order:edit', name: '编辑订单', type: 'button' as const },
  { id: 210, code: 'btn:order:export', name: '导出订单', type: 'button' as const },
];

const mockPermissionsRaw = [
  {
    id: 1,
    code: 'sys:user:view',
    name: '用户查看',
    menuIds: [101, 201],
    menus: [
      { id: 101, code: 'sys:user', name: '用户管理', type: 'menu' },
      { id: 201, code: 'btn:user:add', name: '新增用户', type: 'button' }
    ],
    apis: [
      { method: 'GET', path: '/api/users', description: '获取用户列表' },
      { method: 'GET', path: '/api/users/:id', description: '获取用户详情' },
      { method: 'POST', path: '/api/users', description: '创建用户' }
    ],
    description: '查看用户列表和创建用户权限'
  },
  {
    id: 2,
    code: 'sys:user:edit',
    name: '用户编辑',
    menuIds: [202, 203],
    menus: [
      { id: 202, code: 'btn:user:edit', name: '编辑用户', type: 'button' },
      { id: 203, code: 'btn:user:delete', name: '删除用户', type: 'button' }
    ],
    apis: [
      { method: 'PUT', path: '/api/users/:id', description: '更新用户信息' },
      { method: 'DELETE', path: '/api/users/:id', description: '删除用户' }
    ],
    description: '编辑和删除用户权限'
  },
  {
    id: 3,
    code: 'sys:user:export',
    name: '用户导出',
    menuIds: [204],
    menus: [
      { id: 204, code: 'btn:user:export', name: '导出用户', type: 'button' }
    ],
    apis: [
      { method: 'GET', path: '/api/users/export', description: '导出用户数据' }
    ],
    description: '导出用户数据权限'
  },
  {
    id: 4,
    code: 'sys:role:manage',
    name: '角色管理',
    menuIds: [102, 205, 206, 207],
    menus: [
      { id: 102, code: 'sys:role', name: '角色管理', type: 'menu' },
      { id: 205, code: 'btn:role:add', name: '新增角色', type: 'button' },
      { id: 206, code: 'btn:role:edit', name: '编辑角色', type: 'button' },
      { id: 207, code: 'btn:role:delete', name: '删除角色', type: 'button' }
    ],
    apis: [
      { method: 'GET', path: '/api/roles', description: '获取角色列表' },
      { method: 'GET', path: '/api/roles/:id', description: '获取角色详情' },
      { method: 'POST', path: '/api/roles', description: '创建角色' },
      { method: 'PUT', path: '/api/roles/:id', description: '更新角色' },
      { method: 'DELETE', path: '/api/roles/:id', description: '删除角色' },
      { method: 'POST', path: '/api/roles/:id/permissions', description: '分配权限' }
    ],
    description: '完整的角色管理权限'
  },
  {
    id: 5,
    code: 'sys:menu:manage',
    name: '菜单管理',
    menuIds: [103],
    menus: [
      { id: 103, code: 'sys:menu', name: '菜单管理', type: 'menu' }
    ],
    apis: [
      { method: 'GET', path: '/api/menus', description: '获取菜单列表' },
      { method: 'GET', path: '/api/menus/tree', description: '获取菜单树形结构' },
      { method: 'POST', path: '/api/menus', description: '创建菜单' },
      { method: 'PUT', path: '/api/menus/:id', description: '更新菜单' },
      { method: 'DELETE', path: '/api/menus/:id', description: '删除菜单' }
    ],
    description: '完整的菜单管理权限'
  },
  {
    id: 6,
    code: 'biz:order:view',
    name: '订单查看',
    menuIds: [104],
    menus: [
      { id: 104, code: 'biz:order', name: '订单管理', type: 'menu' }
    ],
    apis: [
      { method: 'GET', path: '/api/orders', description: '获取订单列表' },
      { method: 'GET', path: '/api/orders/:id', description: '获取订单详情' }
    ],
    description: '查看订单列表和详情权限'
  },
  {
    id: 7,
    code: 'biz:order:manage',
    name: '订单管理',
    menuIds: [208, 209],
    menus: [
      { id: 208, code: 'btn:order:add', name: '新增订单', type: 'button' },
      { id: 209, code: 'btn:order:edit', name: '编辑订单', type: 'button' }
    ],
    apis: [
      { method: 'POST', path: '/api/orders', description: '创建订单' },
      { method: 'PUT', path: '/api/orders/:id', description: '更新订单' },
      { method: 'PATCH', path: '/api/orders/:id/status', description: '更新订单状态' }
    ],
    description: '创建和编辑订单权限'
  },
  {
    id: 8,
    code: 'biz:order:export',
    name: '订单导出',
    menuIds: [210],
    menus: [
      { id: 210, code: 'btn:order:export', name: '导出订单', type: 'button' }
    ],
    apis: [
      { method: 'GET', path: '/api/orders/export', description: '导出订单数据' }
    ],
    description: '导出订单数据权限'
  },
  {
    id: 9,
    code: 'biz:product:manage',
    name: '商品管理',
    menuIds: [105],
    menus: [
      { id: 105, code: 'biz:product', name: '商品管理', type: 'menu' }
    ],
    apis: [
      { method: 'GET', path: '/api/products', description: '获取商品列表' },
      { method: 'GET', path: '/api/products/:id', description: '获取商品详情' },
      { method: 'POST', path: '/api/products', description: '创建商品' },
      { method: 'PUT', path: '/api/products/:id', description: '更新商品' },
      { method: 'DELETE', path: '/api/products/:id', description: '删除商品' },
      { method: 'POST', path: '/api/products/:id/stock', description: '库存调整' }
    ],
    description: '完整的商品管理权限'
  },
  {
    id: 10,
    code: 'ana:report:view',
    name: '报表查看',
    menuIds: [106],
    menus: [
      { id: 106, code: 'ana:report', name: '数据分析', type: 'menu' }
    ],
    apis: [
      { method: 'GET', path: '/api/reports/sales', description: '销售报表' },
      { method: 'GET', path: '/api/reports/users', description: '用户报表' },
      { method: 'GET', path: '/api/reports/orders', description: '订单报表' },
      { method: 'GET', path: '/api/logs/operation', description: '操作日志' },
      { method: 'GET', path: '/api/logs/access', description: '访问日志' }
    ],
    description: '查看报表和日志权限'
  }
];

export const mockPermissions = mockPermissionsRaw.map(p => ({
  ...p,
  module: moduleFromCode(p.code)
})) as RbacPermission[];

export const mockRoles: RbacRole[] = [
  { id: 1, roleName: '超级管理员', roleDesc: '拥有所有权限', permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 2, roleName: '系统管理员', roleDesc: '管理系统配置', permissionIds: [1, 2, 3, 4, 5] },
  { id: 3, roleName: '业务管理员', roleDesc: '管理业务数据', permissionIds: [6, 7, 8, 9] },
  { id: 4, roleName: '数据分析师', roleDesc: '查看报表数据', permissionIds: [6, 9, 10] },
  { id: 5, roleName: '普通用户', roleDesc: '基础操作权限', permissionIds: [1, 6, 9] }
];
