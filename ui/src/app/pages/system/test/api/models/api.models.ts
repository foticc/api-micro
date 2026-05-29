export type { ApiResourceDTO as ApiResource, ApiResourceSearchParam } from '@services/system/api-resource.service';

export interface ApiResourcePayload {
  method: string;
  path: string;
  description?: string;
}
