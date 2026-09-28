/** 测试菜单模块表单/提交对象，与正式 `MenuListObj` 字段对齐 */
export interface TestMenuListObj {
  menuName: string;
  code: string;
  alIcon: string;
  icon: string;
  orderNum: number;
  menuType: 'C' | 'F';
  path: string;
  visible: 0 | 1;
  status: boolean;
  newLinkFlag: 0 | 1;
  id?: number;
  fatherId?: number;
}

/** 弹窗入参：在表单字段之外可携带上级权限码/路由前缀 */
export interface TestMenuModalData extends Partial<TestMenuListObj> {
  codePrefix?: string;
  pathPrefix?: string;
}
