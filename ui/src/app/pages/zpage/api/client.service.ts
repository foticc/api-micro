import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';
import * as qs from 'qs';

interface QueryParams {
  name?: string;
  page: number | undefined;
  size: number | undefined;
}

interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Clients {
  id: string | null;
  clientId: string | null;
  clientName: string | null;
  clientIdIssuedAt: string | null;
  clientSecret: string | null;
  clientSecretExpiresAt: Date | null;
  clientAuthenticationMethods: string[] | null;
  authorizationGrantTypes: string[] | null;
  redirectUris: string | null;
  postLogoutRedirectUris: string | null;
  scopes: string | null;
  clientSettings: string | null;
  tokenSettings: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  https = inject(HttpClient);
  http = inject(BaseHttpService);

  getPage(params: QueryParams): Observable<PageResult<Clients>> {
    // return this.http.get('/demo/api/client/manager/page', params);
    const param = new HttpParams({ fromString: qs.stringify(params) });
    // @ts-ignore
    return this.https.get('/demo/api/client/manager/page', { params: param });
  }

  getOne(id: string): Observable<Clients> {
    // return this.http.get('/demo/api/client/manage/get', { id });
    // @ts-ignore
    return this.https.get('/demo/api/client/manager/get', { params: { id: id } });
  }

  save(client: Clients): Observable<Clients> {
    // return this.http.post('/demo/api/client/manage/save', client);
    // @ts-ignore
    return this.https.post('/demo/api/client/manager/save', client);
  }

  delete(id: string): Observable<any> {
    return this.http.post('/demo/api/client/manage/delete', { id: id });
  }
}
