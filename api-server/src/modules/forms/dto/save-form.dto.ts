import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum LeadTypeInput {
  AGENT = 'agent',
  INVESTMENT = 'investment',
  CONSULT = 'consult',
}

export enum PublishStatusInput {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  OFFLINE = 'offline',
}

export enum FormFieldTypeInput {
  TEXT = 'text',
  NUMBER = 'number',
  PHONE = 'phone',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  FILE = 'file',
}

export class FieldValidationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  minLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  maxLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  pattern?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max?: number;
}

export class SaveFormFieldDto {
  @ApiProperty({ example: 'name' })
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message: '字段标识必须以字母开头，且只能包含字母、数字和下划线',
  })
  @MaxLength(64)
  fieldKey!: string;

  @ApiProperty({ example: '姓名' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @ApiProperty({ enum: FormFieldTypeInput, example: FormFieldTypeInput.TEXT })
  @IsEnum(FormFieldTypeInput)
  fieldType!: FormFieldTypeInput;

  @ApiPropertyOptional({ example: '请输入姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeholder?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  options?: string[];

  @ApiProperty({ default: false })
  @IsBoolean()
  required!: boolean;

  @ApiPropertyOptional({ example: { minLength: 2, maxLength: 50 } })
  @IsOptional()
  @ValidateNested()
  @Type(() => FieldValidationDto)
  validation?: FieldValidationDto;

  @ApiProperty({ default: 0 })
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  isVisible!: boolean;
}

export class SaveFormDto {
  @ApiProperty({ example: 'agent' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]*$/, {
    message:
      '表单编码必须以小写字母开头，且只能包含小写字母、数字、下划线和短横线',
  })
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: '代理申请' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: LeadTypeInput })
  @IsEnum(LeadTypeInput)
  leadType!: LeadTypeInput;

  @ApiProperty({ example: '提交代理合作申请' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @ApiPropertyOptional({ example: '申请已提交，我们会尽快联系你' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  successMessage?: string;

  @ApiProperty({ enum: PublishStatusInput })
  @IsEnum(PublishStatusInput)
  status!: PublishStatusInput;

  @ApiProperty({ type: [SaveFormFieldDto] })
  @IsArray()
  @ArrayMinSize(1, { message: '表单至少需要一个字段' })
  @ArrayMaxSize(50, { message: '单个表单最多支持 50 个字段' })
  @ValidateNested({ each: true })
  @Type(() => SaveFormFieldDto)
  fields!: SaveFormFieldDto[];
}
