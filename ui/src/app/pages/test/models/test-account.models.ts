/** 测试账号模块用户模型，与正式 `User` 字段对齐 */
export interface TestUser {
  id: number;
  password: string;
  userName?: string;
  available?: boolean;
  roleName?: string[];
  sex?: 1 | 0;
  telephone?: string;
  mobile?: string | number;
  email?: string;
  lastLoginTime?: Date | string;
  oldPassword?: string;
  roleId?: number[];
  createdAt?: string;
}

export interface TestUserPsd {
  id: number;
  oldPassword: string;
  newPassword: string;
}
