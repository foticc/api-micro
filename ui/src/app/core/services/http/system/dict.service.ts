import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageInfo, SearchCommonVO } from '../../types';
import { BaseHttpService } from '../base-http.service';

/** 字典类别（下拉分组），对应后端 DictDTO */
export interface DictDTO {
  id?: number;
  code: string;
  name: string;
}

/** 字典项（选项值/展示文案），对应后端 DictItemDTO */
export interface DictItemDTO {
  id?: number;
  value: string;
  label: string;
  dictId: number;
}

export interface DictSearchParam {
  keyword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DictService {
  http = inject(BaseHttpService);

  public getDictPage(param: SearchCommonVO<DictSearchParam>): Observable<PageInfo<DictDTO>> {
    return this.http.post('/dict/page', param);
  }

  public getDictDetail(id: number): Observable<DictDTO> {
    return this.http.get(`/dict/${id}`);
  }

  public addDict(param: DictDTO): Observable<void> {
    return this.http.post('/dict/create', param, { needSuccessInfo: true });
  }

  public editDict(param: DictDTO): Observable<void> {
    const { id, ...body } = param;
    return this.http.put(`/dict/${id}`, body, { needSuccessInfo: true });
  }

  public delDict(ids: number[]): Observable<void> {
    return this.http.post('/dict/del', ids, { needSuccessInfo: true });
  }

  /** 某字典类型下的全部字典项（不分页） */
  public getDictItemList(dictId: number): Observable<DictItemDTO[]> {
    return this.http.get('/dict/item/list', { dictId });
  }

  public getDictItemDetail(id: number): Observable<DictItemDTO> {
    return this.http.get(`/dict/item/${id}`);
  }

  public addDictItem(param: DictItemDTO): Observable<void> {
    return this.http.post('/dict/item/create', param, { needSuccessInfo: true });
  }

  public editDictItem(param: DictItemDTO): Observable<void> {
    const { id, ...body } = param;
    return this.http.put(`/dict/item/${id}`, body, { needSuccessInfo: true });
  }

  public delDictItem(ids: number[]): Observable<void> {
    return this.http.post('/dict/item/del', ids, { needSuccessInfo: true });
  }
}
