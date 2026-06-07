export interface ActionResult<T> {
  code: number;
  msg: string;
  data: T;
}
