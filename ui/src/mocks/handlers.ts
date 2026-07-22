import { apiResource } from './business/api-resource';
import { auditDemo } from './business/audit-demo';
import { codegen } from './business/codegen';
import { department } from './business/department';
import { dict } from './business/dict';
import { example } from './business/example';
import { login, loginOut } from './business/login';
import { menu } from './business/menu';
import { oauth2Admin } from './business/oauth2-admin';
import { permission } from './business/permission';
import { rbacTest } from './business/rbac-test';
import { rbacTestApiSync } from './business/rbac-test-api-sync';
import { rbacTestMenu } from './business/rbac-test-menu';
import { rbacTestUser } from './business/rbac-test-user';
import { role } from './business/role';
import { user } from './business/user';

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
  ...auditDemo,
  ...codegen,
  ...example,
  ...rbacTest,
  ...rbacTestMenu,
  ...rbacTestUser,
  ...rbacTestApiSync,
  ...oauth2Admin
];
