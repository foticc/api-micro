import { HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';

import {
  CodeGenRequest,
  CodeGenResult,
  CodeGenSchemaDetailVO,
  CodeGenSchemaPageParam,
  CodeGenSchemaPageResult,
  CodeGenSchemaSaveRequest,
  CodeGenTypesResponse
} from '../models/codegen.models';

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

  getSchemaPageResource(param: () => CodeGenSchemaPageParam): HttpResourceRef<CodeGenSchemaPageResult> {
    return this.http.postResource<CodeGenSchemaPageResult>('/demo/codegen/schemas/page', param);
  }

  getSchemaDetail(id: number): Observable<CodeGenSchemaDetailVO> {
    return this.http.get<CodeGenSchemaDetailVO>(`/demo/codegen/schemas/${id}`);
  }

  createSchema(body: CodeGenSchemaSaveRequest): Observable<CodeGenSchemaDetailVO> {
    return this.http.post<CodeGenSchemaDetailVO>('/demo/codegen/schemas', body, { needSuccessInfo: true });
  }

  updateSchema(id: number, body: CodeGenSchemaSaveRequest): Observable<CodeGenSchemaDetailVO> {
    return this.http.put<CodeGenSchemaDetailVO>(`/demo/codegen/schemas/${id}`, body, { needSuccessInfo: true });
  }

  deleteSchemas(ids: number[]): Observable<void> {
    return this.http.post<void>('/demo/codegen/schemas/del', ids, { needSuccessInfo: true });
  }
}
