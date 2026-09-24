import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';

import { PropertyHistory, PropertyLatest } from '../models/iot-property.models';

@Service()
export class IotPropertyService {
  private http = inject(BaseHttpService);

  latest(deviceId: number): Observable<PropertyLatest[]> {
    return this.http.get<PropertyLatest[]>(`/api/v1/iot/devices/${deviceId}/properties/latest`);
  }

  history(deviceId: number, query: { identifier: string; from: string; to: string }): Observable<PropertyHistory> {
    return this.http.get<PropertyHistory>(`/api/v1/iot/devices/${deviceId}/properties/history`, query);
  }
}
