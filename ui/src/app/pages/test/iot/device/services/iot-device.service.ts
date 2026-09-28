import { HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { PageInfo, SearchCommonVO } from '@core/services/types';
import { BaseHttpService } from '@services/base-http.service';

import { DeviceSample, IotDevice, IotDeviceQuery } from '../models/iot-device.models';

@Service()
export class IotDeviceService {
  private http = inject(BaseHttpService);
  private readonly base = '/api/v1/iot/devices';

  getPageResource(param: () => SearchCommonVO<IotDeviceQuery>): HttpResourceRef<PageInfo<IotDevice>> {
    return this.http.postResource<PageInfo<IotDevice>>(`${this.base}/page`, param);
  }

  getDetail(id: number): Observable<IotDevice> {
    return this.http.get<IotDevice>(`${this.base}/${id}`);
  }

  page(param: SearchCommonVO<IotDeviceQuery>): Observable<PageInfo<IotDevice>> {
    return this.http.post<PageInfo<IotDevice>>(`${this.base}/page`, param);
  }

  create(param: IotDevice): Observable<IotDevice> {
    return this.http.post<IotDevice>(`${this.base}/create`, param, { needSuccessInfo: true });
  }

  update(id: number, param: IotDevice): Observable<IotDevice> {
    return this.http.put<IotDevice>(`${this.base}/${id}`, param, { needSuccessInfo: true });
  }

  delete(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.base}/del`, ids, { needSuccessInfo: true });
  }

  disable(id: number): Observable<IotDevice> {
    return this.http.post<IotDevice>(`${this.base}/${id}/disable`, null, { needSuccessInfo: true });
  }

  enable(id: number): Observable<IotDevice> {
    return this.http.post<IotDevice>(`${this.base}/${id}/enable`, null, { needSuccessInfo: true });
  }

  resetSecret(id: number): Observable<IotDevice> {
    return this.http.post<IotDevice>(`${this.base}/${id}/reset-secret`, null);
  }

  sample(id: number): Observable<DeviceSample> {
    return this.http.post<DeviceSample>(`${this.base}/${id}/sample`, null, { needSuccessInfo: true });
  }

  upgradeTsl(id: number): Observable<IotDevice> {
    return this.http.post<IotDevice>(`${this.base}/${id}/upgrade-tsl`, null, { needSuccessInfo: true });
  }
}
