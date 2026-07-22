import { HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';

import { CodeGenRequest, CodeGenResult, CodeGenTypesResponse } from '../models/codegen.models';

@Service()
export class CodeGenService {
  private http = inject(BaseHttpService);

  getJavaTypesResource(): HttpResourceRef<CodeGenTypesResponse> {
    return this.http.getResource<CodeGenTypesResponse>('/demo/codegen/types');
  }

  getJavaTypes(): Observable<CodeGenTypesResponse> {
    return this.http.get<CodeGenTypesResponse>('/demo/codegen/types');
  }

  preview(request: CodeGenRequest): Observable<CodeGenResult> {
    return this.http.post<CodeGenResult>('/demo/codegen/preview', request);
  }
}
