import { IsString, IsNumber, IsOptional, IsUrl, Min, Max } from 'class-validator';

export class AuthConfigSchema {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  AUTH_DB_HOST?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  AUTH_DB_PORT?: number;

  @IsOptional()
  @IsString()
  AUTH_DB_USER?: string;

  @IsOptional()
  @IsString()
  AUTH_DB_PASSWORD?: string;

  @IsOptional()
  @IsString()
  AUTH_DB_NAME?: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  KAFKA_BROKERS?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsUrl()
  GOOGLE_CALLBACK_URL?: string;

  @IsOptional()
  @IsString()
  FACEBOOK_APP_ID?: string;

  @IsOptional()
  @IsString()
  FACEBOOK_APP_SECRET?: string;

  @IsOptional()
  @IsUrl()
  FACEBOOK_CALLBACK_URL?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  MAX_FAILED_ATTEMPTS?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  LOCK_DURATION_MINUTES?: number;
}

