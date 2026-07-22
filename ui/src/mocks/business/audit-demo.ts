import { http, HttpResponse } from 'msw';

interface AuditDemoRow {
  id: number;
  title: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

let rows: AuditDemoRow[] = [
  {
    id: 1,
    title: '订单创建审计',
    content: '演示 @CreatedDate / @CreatedBy 自动填充',
    createdAt: '2026-01-10T09:00:00',
    updatedAt: '2026-01-10T09:00:00',
    createdBy: 'admin',
    lastModifiedBy: 'admin'
  },
  {
    id: 2,
    title: '用户更新审计',
    content: '演示 @LastModifiedDate / @LastModifiedBy 自动填充',
    createdAt: '2026-01-11T14:30:00',
    updatedAt: '2026-01-15T16:20:00',
    createdBy: 'admin',
    lastModifiedBy: 'test-user'
  },
  {
    id: 3,
    title: '示例记录',
    content: '第三条 Mock 数据',
    createdAt: '2026-01-12T11:00:00',
    updatedAt: '2026-01-12T11:00:00',
    createdBy: 'admin',
    lastModifiedBy: 'admin'
  }
];

let nextId = 4;

function pageSlice<T>(list: T[], pageIndex: number, pageSize: number) {
  const total = list.length;
  const start = (pageIndex - 1) * pageSize;
  return { total, pageSize, pageIndex, list: list.slice(start, start + pageSize) };
}

function nowStr(): string {
  return new Date().toISOString();
}

export const auditDemo = [
  http.post('/site/api/audit/demo/page', async ({ request }) => {
    const body = (await request.json()) as {
      pageIndex: number;
      pageSize: number;
      filters?: { keyword?: string };
    };
    const { pageIndex, pageSize, filters } = body;
    let list = [...rows];
    const kw = filters?.keyword?.trim().toLowerCase();
    if (kw) {
      list = list.filter(r => r.title.toLowerCase().includes(kw) || (r.content?.toLowerCase().includes(kw) ?? false));
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: pageSlice(list, pageIndex, pageSize) });
  }),

  http.get('/site/api/audit/demo/:id', ({ params }) => {
    const id = Number(params['id']);
    const item = rows.find(r => r.id === id);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),

  http.post('/site/api/audit/demo', async ({ request }) => {
    const body = (await request.json()) as Pick<AuditDemoRow, 'title' | 'content'>;
    const ts = nowStr();
    const row: AuditDemoRow = {
      ...body,
      id: nextId++,
      createdAt: ts,
      updatedAt: ts,
      createdBy: 'admin',
      lastModifiedBy: 'admin'
    };
    rows.push(row);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: row });
  }),

  http.put('/site/api/audit/demo/:id', async ({ request, params }) => {
    const id = Number(params['id']);
    const body = (await request.json()) as Pick<AuditDemoRow, 'title' | 'content'>;
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, msg: '记录不存在', data: null }, { status: 200 });
    }
    rows[idx] = {
      ...rows[idx],
      ...body,
      updatedAt: nowStr(),
      lastModifiedBy: 'admin'
    };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: rows[idx] });
  }),

  http.post('/site/api/audit/demo/del', async ({ request }) => {
    const ids = (await request.json()) as number[];
    rows = rows.filter(r => !ids.includes(r.id));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  })
];
