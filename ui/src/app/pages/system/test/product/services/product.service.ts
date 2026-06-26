import { inject, Service } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ProductParam, ProductQueryParam, ProductVO } from '../models/product.models';
import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

@Service()
export class ProductService {
  private http = inject(BaseHttpService);

  getPageResource(param: () => SearchCommonVO<ProductQueryParam>): HttpResourceRef<PageInfo<ProductVO>> {
    return this.http.postResource<PageInfo<ProductVO>>('/demo/generated/product/page', param);
  }

  getDetail(id: number): Observable<ProductVO> {
    return this.http.get<ProductVO>(`/demo/generated/product/${id}`);
  }

  create(param: ProductParam): Observable<ProductVO> {
    return this.http.post<ProductVO>('/demo/generated/product', param, { needSuccessInfo: true });
  }

  update(id: number, param: ProductParam): Observable<ProductVO> {
    return this.http.put<ProductVO>(`/demo/generated/product/${id}`, param, { needSuccessInfo: true });
  }

  delete(ids: number[]): Observable<void> {
    return this.http.post<void>('/demo/generated/product/del', ids, { needSuccessInfo: true });
  }
}
