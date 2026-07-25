import Joi from 'joi';

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  ADMIN_WEB_ORIGIN: Joi.string().uri().default('http://localhost:5173'),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  DATABASE_URL: Joi.string().required(),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(3307),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().allow('').required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_CONNECTION_LIMIT: Joi.number().integer().min(1).max(50).default(10),
  DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
  REDIS_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  REDIS_URL: Joi.string().required(),
  TRUST_PROXY_HOPS: Joi.number().integer().min(0).max(10).default(1),
  PUBLIC_FORM_RATE_WINDOW_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(86400)
    .default(600),
  PUBLIC_FORM_RATE_IP_MAX: Joi.number().integer().min(1).max(1000).default(20),
  PUBLIC_FORM_RATE_FORM_IP_MAX: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(6),
  PUBLIC_FORM_MAX_BODY_BYTES: Joi.number()
    .integer()
    .min(4096)
    .max(262144)
    .default(32768),
  PUBLIC_FORM_ALLOWED_SOURCES: Joi.string().default('wechat_miniprogram,web'),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('2h'),
  APP_DATA_ENCRYPTION_KEY: Joi.string().min(32).required(),
  MEDIA_STORAGE_DRIVER: Joi.string().valid('local', 'cos').default('local'),
  MEDIA_STORAGE_DIR: Joi.string().default('storage/media'),
  MEDIA_TEMP_DIR: Joi.string().default('storage/tmp/media'),
  MEDIA_MAX_FILE_SIZE_BYTES: Joi.number()
    .integer()
    .min(1024 * 1024)
    .max(50 * 1024 * 1024)
    .default(20 * 1024 * 1024),
  MEDIA_PUBLIC_BASE_URL: Joi.string()
    .uri()
    .default('http://localhost:3000/media'),
  COS_SECRET_ID: Joi.string().when('MEDIA_STORAGE_DRIVER', {
    is: 'cos',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  COS_SECRET_KEY: Joi.string().when('MEDIA_STORAGE_DRIVER', {
    is: 'cos',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  COS_BUCKET: Joi.string().when('MEDIA_STORAGE_DRIVER', {
    is: 'cos',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  COS_REGION: Joi.string().when('MEDIA_STORAGE_DRIVER', {
    is: 'cos',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  COS_PUBLIC_BASE_URL: Joi.string().uri().allow('').optional(),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  LOG_PRETTY: Joi.boolean().truthy('true').falsy('false').default(false),
}).unknown(true);

export function validateEnvironment(config: Record<string, unknown>) {
  const validation = schema.validate(config, { abortEarly: false }) as {
    error?: Error;
    value: Record<string, unknown>;
  };
  if (validation.error) {
    throw new Error(
      `Environment validation failed: ${validation.error.message}`,
    );
  }
  return validation.value;
}
