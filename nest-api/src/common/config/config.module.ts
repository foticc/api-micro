import { Module } from '@nestjs/common';
import { ConfigModule as Config } from '@nestjs/config';
import * as Joi from 'joi'; // 对环境变量进行校验
import * as process from 'node:process';

// 环境变量加载顺序，数组元素索引靠前的优先级高
const envFilePath = [`.env.${process.env.NODE_ENV || 'development'}`, '.env'];

// 已知的弱默认 JWT Secret 黑名单
const WEAK_SECRETS = ['EIpWsyfiy@R@X#qn17!StJNdZK1fFF8iV6ffN!goZkqt#JxO'];

// 对环境变量进行校验
const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),
  DATABASE_URL: Joi.string(),
  // 本项目开源，所以希望开发者能主动调整环境配置中的JWT Secret，而不要用项目默认的Secret用于生产环境
  // 此处对于默认Secret进行了校验
  SECRET: Joi.string()
    .required()
    .custom((value: string, helpers: Joi.CustomHelpers<string>) => {
      const isProduction = process.env.NODE_ENV === 'production';
      const isWeakSecret = WEAK_SECRETS.includes(value);

      if (isWeakSecret) {
        if (isProduction) {
          return helpers.error('secret.insecure');
        } else {
          console.warn(
            '\x1b[33m%s\x1b[0m',
            '⚠️  警告: 您正在使用默认的 JWT Secret，请在生产环境中修改 SECRET 环境变量！',
          );
        }
      }
      return value;
    }, 'JWT Secret validation')
    .messages({
      'secret.insecure':
        '🚫 安全错误: 生产环境不能使用默认的 JWT Secret，请设置一个强 SECRET 环境变量。',
      'any.required': 'SECRET 环境变量是必需的。',
    }),
  // 默认Secret校验结束
  // DB_HOST: Joi.string().ip()
});

@Module({
  imports: [
    Config.forRoot({
      isGlobal: true,
      envFilePath,
      // 对环境变量进行校验
      validationSchema: schema,
    }),
  ],
  providers: [],
  exports: [],
})
export class ConfigModule {}
