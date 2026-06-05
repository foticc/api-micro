import { http, HttpResponse } from 'msw';

interface TestUserRecord {
  id: number;
  email: string;
  userName: string;
  password: string;
  available: boolean;
  sex: number;
  mobile: string;
  telephone: string;
  lastLoginTime: string;
  createdAt?: string;
}

const userRoles: Record<number, number[]> = {
  2001: [1],
  2002: [2]
};

let testUsers: TestUserRecord[] = [
  {
    id: 2001,
    email: 'test-admin@example.com',
    userName: '试验管理员',
    password: 'a123456',
    available: true,
    sex: 1,
    mobile: '13800000001',
    telephone: '02880000001',
    lastLoginTime: '2026-01-15T08:00:00.000Z',
    createdAt: '2026-01-01 10:00:00'
  },
  {
    id: 2002,
    email: 'test-user@example.com',
    userName: '试验普通用户',
    password: 'a123456',
    available: true,
    sex: 0,
    mobile: '13800000002',
    telephone: '02880000002',
    lastLoginTime: '2026-01-16T09:30:00.000Z',
    createdAt: '2026-01-02 11:00:00'
  }
];

let nextId = 2003;

function sortUsers(list: TestUserRecord[], sort?: string): TestUserRecord[] {
  if (!sort?.trim()) {
    return list;
  }
  const [field, dir] = sort.split(',');
  if (!field || (dir !== 'asc' && dir !== 'desc')) {
    return list;
  }
  const factor = dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = a[field as keyof TestUserRecord];
    const bv = b[field as keyof TestUserRecord];
    if (av == null && bv == null) {
      return 0;
    }
    if (av == null) {
      return -1 * factor;
    }
    if (bv == null) {
      return 1 * factor;
    }
    if (field === 'lastLoginTime') {
      return (new Date(String(av)).getTime() - new Date(String(bv)).getTime()) * factor;
    }
    return String(av).localeCompare(String(bv), 'zh-CN') * factor;
  });
}

function filterUsers(filters?: Partial<TestUserRecord>): TestUserRecord[] {
  let list = [...testUsers];
  if (filters?.userName) {
    list = list.filter(u => u.userName.includes(String(filters.userName)));
  }
  if (filters?.mobile) {
    list = list.filter(u => String(u.mobile).includes(String(filters.mobile)));
  }
  if (filters?.available !== undefined && filters.available !== null) {
    list = list.filter(u => u.available === filters.available);
  }
  return list;
}

export const rbacTestUser = [
  http.post('/site/api/rbac/users/page', async ({ request }) => {
    const body = (await request.json()) as {
      pageIndex: number;
      pageSize: number;
      filters?: Partial<TestUserRecord>;
      sort?: string;
    };
    const { pageIndex, pageSize, filters, sort } = body;
    const list = sortUsers(filterUsers(filters), sort);
    const total = list.length;
    const start = (pageIndex - 1) * pageSize;
    return HttpResponse.json({
      code: 200,
      msg: 'SUCCESS',
      data: { total, pageSize, pageIndex, list: list.slice(start, start + pageSize) }
    });
  }),

  http.get('/site/api/rbac/users/:id', ({ params }) => {
    const userId = Number(params['id']);
    const item = testUsers.find(u => u.id === userId);
    if (!item) {
      return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
    }
    return HttpResponse.json({
      code: 200,
      msg: 'SUCCESS',
      data: { ...item, roleId: userRoles[userId] || [] }
    });
  }),

  http.get('/site/api/rbac/users/auth-code/:id', () => {
    return HttpResponse.json({
      code: 200,
      msg: 'SUCCESS',
      data: ['default:system:test', 'default:system:test:account']
    });
  }),

  http.post('/site/api/rbac/users', async ({ request }) => {
    const body = (await request.json()) as Omit<TestUserRecord, 'id' | 'lastLoginTime' | 'createdAt'> & { roleId?: number[] };
    const timestamp = new Date().toISOString();
    const newItem: TestUserRecord = {
      ...body,
      id: nextId++,
      lastLoginTime: timestamp,
      createdAt: timestamp.replace('T', ' ').slice(0, 19)
    };
    testUsers.push(newItem);
    if (body.roleId?.length) {
      userRoles[newItem.id] = body.roleId;
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.put('/site/api/rbac/users/:id', async ({ request, params }) => {
    const userId = Number(params['id']);
    const body = (await request.json()) as Omit<TestUserRecord, 'id'> & { roleId?: number[] };
    const idx = testUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      testUsers[idx] = { ...testUsers[idx], ...body, id: userId };
    }
    if (body.roleId) {
      userRoles[userId] = body.roleId;
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/rbac/users/del', async ({ request }) => {
    const { ids } = (await request.json()) as { ids: number[] };
    testUsers = testUsers.filter(u => !ids.includes(u.id));
    ids.forEach(id => delete userRoles[id]);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.put('/site/api/rbac/users/:id/psd', async () => {
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  })
];
