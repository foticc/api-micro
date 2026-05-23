import { http, HttpResponse } from 'msw';

interface DictRow {
  id: number;
  code: string;
  name: string;
}

interface DictItemRow {
  id: number;
  value: string;
  label: string;
  dictId: number;
}

let dicts: DictRow[] = [
  { id: 1, code: 'user_status', name: '用户状态' },
  { id: 2, code: 'order_type', name: '订单类型' }
];

let dictItems: DictItemRow[] = [
  { id: 1, value: '1', label: '启用', dictId: 1 },
  { id: 2, value: '0', label: '禁用', dictId: 1 },
  { id: 3, value: 'NORMAL', label: '普通订单', dictId: 2 },
  { id: 4, value: 'VIP', label: '会员订单', dictId: 2 }
];

let nextDictId = 3;
let nextItemId = 5;

function pageSlice<T>(list: T[], pageIndex: number, pageSize: number) {
  const total = list.length;
  const start = (pageIndex - 1) * pageSize;
  return { total, pageSize, pageIndex, list: list.slice(start, start + pageSize) };
}

export const dict = [
  http.post('/site/api/dict/page', async ({ request }) => {
    const body = (await request.json()) as {
      pageIndex: number;
      pageSize: number;
      filters?: { keyword?: string };
    };
    const { pageIndex, pageSize, filters } = body;
    let list = [...dicts];
    const kw = filters?.keyword?.trim();
    if (kw) {
      list = list.filter(d => d.code.includes(kw) || d.name.includes(kw));
    }
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: pageSlice(list, pageIndex, pageSize) });
  }),

  http.get('/site/api/dict/:id', ({ params }) => {
    const id = Number(params['id']);
    const item = dicts.find(d => d.id === id);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),

  http.post('/site/api/dict/create', async ({ request }) => {
    const body = (await request.json()) as Omit<DictRow, 'id'>;
    const row: DictRow = { ...body, id: nextDictId++ };
    dicts.push(row);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.put('/site/api/dict/update', async ({ request }) => {
    const body = (await request.json()) as DictRow;
    const idx = dicts.findIndex(d => d.id === body.id);
    if (idx !== -1) dicts[idx] = { ...dicts[idx], ...body };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/dict/del', async ({ request }) => {
    const { ids } = (await request.json()) as { ids: number[] };
    dicts = dicts.filter(d => !ids.includes(d.id));
    dictItems = dictItems.filter(i => !ids.includes(i.dictId));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.get('/site/api/dict/item/list', ({ request }) => {
    const url = new URL(request.url);
    const dictId = Number(url.searchParams.get('dictId'));
    const list = dictItems.filter(i => i.dictId === dictId);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: list });
  }),

  http.get('/site/api/dict/item/:id', ({ params }) => {
    const id = Number(params['id']);
    const item = dictItems.find(i => i.id === id);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: item ?? null });
  }),

  http.post('/site/api/dict/item/create', async ({ request }) => {
    const body = (await request.json()) as Omit<DictItemRow, 'id'>;
    const row: DictItemRow = { ...body, id: nextItemId++ };
    dictItems.push(row);
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.put('/site/api/dict/item/update', async ({ request }) => {
    const body = (await request.json()) as DictItemRow;
    const idx = dictItems.findIndex(i => i.id === body.id);
    if (idx !== -1) dictItems[idx] = { ...dictItems[idx], ...body };
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  }),

  http.post('/site/api/dict/item/del', async ({ request }) => {
    const { ids } = (await request.json()) as { ids: number[] };
    dictItems = dictItems.filter(i => !ids.includes(i.id));
    return HttpResponse.json({ code: 200, msg: 'SUCCESS', data: null });
  })
];
