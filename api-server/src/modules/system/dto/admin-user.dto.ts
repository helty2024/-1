import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum AdminUserStatusInput {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

const usernamePattern = /^[a-zA-Z0-9_.-]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export class ListAdminUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsEnum(AdminUserStatusInput)
  status?: AdminUserStatusInput;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

export class CreateAdminUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(usernamePattern)
  username!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(passwordPattern)
  password!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  roleIds!: string[];
}

export class UpdateAdminUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(usernamePattern)
  username!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  roleIds!: string[];
}

export class UpdateAdminUserStatusDto {
  @IsEnum(AdminUserStatusInput)
  status!: AdminUserStatusInput;
}

export class ResetAdminPasswordDto {
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(passwordPattern)
  newPassword!: string;
}
