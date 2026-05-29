import { http, HttpResponse } from 'msw';

interface TestMenuRecord {
  id: number;
  fatherId: number;
  menuName: string;
  menuType: string;
  alIcon: string;
  icon: string;
  path: string;
  code: string;
  orderNum: number;
  status: boolean;
  newLinkFlag: boolean;
  visible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const now = () => new Date().toISOString();

let testMenus: TestMenuRecord[] = [
  {
    id: 1001,
    fatherId: 0,
    menuName: 'RBAC 试验',
    menuType: 'C',
    alIcon: '',
    icon: 'experiment',
    path: '/default/system/test',
    code: 'default:system:test',
    orderNum: 1,
    status: true,
    newLinkFlag: false,
    visible: true,
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00'
  },
  {
    id: 1002,
    fatherId: 1001,
    menuName: '权限资源组',
    menuType: 'C',
    alIcon: '',
    icon: 'lock',
    path: '/default/system/test/permission',
    code: 'default:system:test:permission',
    orderNum: 1,
    status: true,
    newLinkFlag: false,
    visible: true,
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00'
  },
  {
    id: 1003,
    fatherId: 1001,
    menuName: '角色分配',
    menuType: 'C',
    alIcon: '',
    icon: 'team',
    path: '/default/system/test/role-assignment',
    code: 'default:system:test:role-assignment',
    orderNum: 2,
    status: true,
    newLinkFlag: false,
    visible: true,
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00'
  },
  {
    id: 1004,
    fatherId: 1001,
    menuName: '菜单管理（测试）',
    menuType: 'C',
    alIcon: '',
    icon: 'menu',
    path: '/default/system/test/menu',
    code: 'default:system:test:menu',
    orderNum: 3,
    status: true,
    newLinkFlag: false,
    visible: true,
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00'
  },
  {
    id: 1008,
    fatherId: 1001,
    menuName: '账号管理（测试）',
    menuType: 'C',
    alIcon: '',
    icon: 'user',
    path: '/default/system/test/account',
    code: 'default:system:test:account',
    orderNum: 4,
    status: true,
    newLinkFlag: false,
    visible: true,
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00'
  },
  {
    id: 1005,
    fatherId: 1004,
    menuName: '测试菜单新增',
    menuType: 'F',
    alIcon: '',
    icon: '',
    path: '',
    code: 'default:system:test:menu:add',
    orderNum: 1,
    status: true,
    newLinkFlag: false,
    visible: false,
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00'
  },
  {
    id: 1006,
    fatherId: 1004,
    menuName: '测试菜单编辑',
    menuType: 'F',
    alIcon: '',
    icon: '',
    path: '',
    code: 'default:system:test:menu:edit',
    orderNum: 2,
    status: true,
    newLinkFlag: false,
    visible: false,
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00'
  },
  {
    id: 1007,
    fatherId: 1004,
    menuName: '测试菜单删除',
    menuType: 'F',
    alIcon: '',
    icon: '',
    path: '',
    code: 'default:system:test:menu:del',
    orderNum: 3,
    status: true,
    newLinkFlag: false,
    visible: false,
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00'
  }
];

let nextId = 1009;

function filterMenus(filters?: Partial<TestMenuRecord>): TestMenuRecord[] {
  let list = [...testMenus];
  if (filters?.menuName) {
    list = list.filter(m => m.menuName.includes(String(filters.menuName)));
  }
  if (filters?.visible !== undefined && filters.visible !== null) {
    list = list.filter(m => m.visible === filters.visible);
  }
  return list;
}

export const rbacTestMenu = [
  http.post('/site/api/rbac/menus/list', async ({ request }) => {
    const body = (await request.json()) as { pageIndex: number; pageSize: number; filters?: Partial<TestMenuRecord> };
    const { pageIndex, pageSize, filters } = body;
    const list = filterMenus(filters);

    if (pageSize === 0) {
      return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: list });
    }

    const start = (pageIndex - 1) * pageSize;
    return HttpResponse.json({
      code: 200,
      msg: 'SUCCESS',
      data: list.slice(start, start + pageSize)
    });
  }),

  http.get('/site/api/rbac/menus/:id', ({ params }) => {
    const item = testMenus.find(m => m.id === Number(params['id']));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),

  http.post('/site/api/rbac/menus', async ({ request }) => {
    const body = (await request.json()) as Omit<TestMenuRecord, 'id' | 'createdAt' | 'updatedAt'>;
    const timestamp = now();
    const newItem: TestMenuRecord = {
      ...body,
      id: nextId++,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    testMenus.push(newItem);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.put('/site/api/rbac/menus/:id', async ({ request, params }) => {
    const menuId = Number(params['id']);
    const body = (await request.json()) as Omit<TestMenuRecord, 'id' | 'createdAt' | 'updatedAt'>;
    const idx = testMenus.findIndex(m => m.id === menuId);
    if (idx !== -1) {
      testMenus[idx] = { ...testMenus[idx], ...body, id: menuId, updatedAt: now() };
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/rbac/menus/del', async ({ request }) => {
    const { ids } = (await request.json()) as { ids: number[] };
    testMenus = testMenus.filter(m => !ids.includes(m.id));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  })
];
