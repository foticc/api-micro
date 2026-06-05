import { login, loginOut } from './business/login';
import { user } from './business/user';
import { department } from './business/department';
import { role } from './business/role';
import { menu } from './business/menu';
import { permission } from './business/permission';
import { dict } from './business/dict';
import { apiResource } from './business/api-resource';
import { rbacTest } from './business/rbac-test';
import { rbacTestMenu } from './business/rbac-test-menu';
import { rbacTestUser } from './business/rbac-test-user';
import { rbacTestApiSync } from './business/rbac-test-api-sync';
import { oauth2Admin } from './business/oauth2-admin';
import { example } from './business/example';

export const handlers = [
  login,
  loginOut,
  ...user,
  ...department,
  ...role,
  ...menu,
  ...permission,
  ...dict,
  ...apiResource,
  ...example,
  ...rbacTest,
  ...rbacTestMenu,
  ...rbacTestUser,
  ...rbacTestApiSync,
  ...oauth2Admin,
];
