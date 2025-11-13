import type { z } from 'zod'

export type PortSchema = z.ZodEffects<
  z.ZodEffects<z.ZodNumber, number, string>,
  number,
  string
>

export type LifetimeSchema = z.ZodString

export type UrlSchema = z.ZodString

export type EmailSchema = z.ZodString

export type SecretSchema = z.ZodString

export interface CommonSchemas {
  portSchema: PortSchema
  lifetimeSchema: LifetimeSchema
  urlSchema: UrlSchema
  emailSchema: EmailSchema
  secretSchema: SecretSchema
}

export type AppSchemaType = z.ZodObject<{
  NODE_ENV: z.ZodDefault<z.ZodEnum<['development', 'production', 'test']>>
  BACK_PORT: z.ZodDefault<PortSchema>
  BACK_HOST: z.ZodDefault<z.ZodString>
  FRONT_HOST: z.ZodDefault<z.ZodString>
  FRONT_PORT: z.ZodDefault<PortSchema>
}>

export type DatabaseSchemaType = z.ZodObject<{
  MONGODB_URI: UrlSchema
  DB_NAME: z.ZodDefault<z.ZodString>
}>

export type JwtSchemaType = z.ZodObject<{
  JWT_SECRET: SecretSchema
  ACCESS_TOKEN_LIFETIME: z.ZodDefault<LifetimeSchema>
  REFRESH_TOKEN_LIFETIME: z.ZodDefault<LifetimeSchema>
  ACCESS_TOKEN_NAME: z.ZodDefault<z.ZodString>
  REFRESH_TOKEN_NAME: z.ZodDefault<z.ZodString>
}>

export type EmailSchemaType = z.ZodObject<{
  SMTP_HOST: z.ZodString
  SMTP_PORT: z.ZodEffects<z.ZodNumber, number, string>
  SMTP_USER: z.ZodString
  SMTP_PASS: z.ZodString
  CODE_LIFETIME: z.ZodDefault<LifetimeSchema>
}>

export type OAuthSchemaType = z.ZodObject<{
  OAUTH_CLIENT_ID: z.ZodString
  OAUTH_CLIENT_SECRET: z.ZodString
  GOOGLE_CALLBACK_URL: UrlSchema
}>

export interface AllSchemas {
  app: AppSchemaType
  database: DatabaseSchemaType
  jwt: JwtSchemaType
  email: EmailSchemaType
  oauth: OAuthSchemaType
}

export declare function createCommonSchemas(): CommonSchemas

export declare function getAppSchema(): AppSchemaType

export declare function getDatabaseSchema(): DatabaseSchemaType

export declare function getJwtSchema(): JwtSchemaType

export declare function getEmailSchema(): EmailSchemaType

export declare function getOAuthSchema(): OAuthSchemaType

export declare function getAllSchemas(): AllSchemas
