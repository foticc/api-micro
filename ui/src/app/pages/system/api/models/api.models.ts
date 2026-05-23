export interface ApiResource {
  id: number;
  method: string;
  path: string;
  description?: string;
}

export interface ApiResourcePayload {
  method: string;
  path: string;
  description?: string;
}
