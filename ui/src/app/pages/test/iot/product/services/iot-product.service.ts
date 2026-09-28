import { HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

import { IotProduct, IotProductQuery, IotTslModel } from '../models/iot-product.models';

@Service()
export class IotProductService {
  private http = inject(BaseHttpService);
  private readonly base = '/api/v1/iot/products';

  getPageResource(param: () => SearchCommonVO<IotProductQuery>): HttpResourceRef<PageInfo<IotProduct>> {
    return this.http.postResource<PageInfo<IotProduct>>(`${this.base}/page`, param);
  }

  page(param: SearchCommonVO<IotProductQuery>): Observable<PageInfo<IotProduct>> {
    return this.http.post<PageInfo<IotProduct>>(`${this.base}/page`, param);
  }

  getDetail(id: number): Observable<IotProduct> {
    return this.http.get<IotProduct>(`${this.base}/${id}`);
  }

  create(param: IotProduct): Observable<IotProduct> {
    return this.http.post<IotProduct>(`${this.base}/create`, param, { needSuccessInfo: true });
  }

  update(id: number, param: IotProduct): Observable<IotProduct> {
    return this.http.put<IotProduct>(`${this.base}/${id}`, param, { needSuccessInfo: true });
  }

  delete(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.base}/del`, ids, { needSuccessInfo: true });
  }

  publishTsl(id: number, param: Pick<IotTslModel, 'schemaJson' | 'changelog'>): Observable<IotTslModel> {
    return this.http.post<IotTslModel>(`${this.base}/${id}/tsl`, param, { needSuccessInfo: true });
  }

  currentTsl(id: number): Observable<IotTslModel> {
    return this.http.get<IotTslModel>(`${this.base}/${id}/tsl/current`);
  }

  tslVersion(id: number, version: number): Observable<IotTslModel> {
    return this.http.get<IotTslModel>(`${this.base}/${id}/tsl/${version}`);
  }

  listTsl(id: number): Observable<IotTslModel[]> {
    return this.http.get<IotTslModel[]>(`${this.base}/${id}/tsl`);
  }
}
