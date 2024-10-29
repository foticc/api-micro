import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';

interface QueryParams {
  name: string;
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
  clientIdIssuedAt: string | null;
  clientSecret: string | null;
  clientSecretExpiresAt: Date | null;
  clientName: string | null;
  clientAuthenticationMethods: string | null;
  authorizationGrantTypes: string | null;
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
  http = inject(BaseHttpService);

  getPage(params: QueryParams): Observable<PageResult<Clients>> {
    return this.http.get('/client/manager/page', params);
  }

  getOne(id: string): Observable<Clients> {
    return this.http.get('/client/manage/get', { id });
  }

  save(client: Clients): Observable<Clients> {
    return this.http.post('/client/manage/save', client);
  }

  delete(id: string): Observable<any> {
    return this.http.post('/client/manage/delete', { id: id });
  }
}
