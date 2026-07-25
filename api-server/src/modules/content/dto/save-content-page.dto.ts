import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum ContentPublishStatusInput {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  OFFLINE = 'offline',
}

export class ContentStatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  value!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string;
}

export class ContentCardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(1000)
  desc!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  actionText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsBoolean()
  tab?: boolean;
}

export class ContentBlockDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(3000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @IsOptional()
  @IsBoolean()
  showProductCards?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  actionText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  actionUrl?: string;

  @IsOptional()
  @IsBoolean()
  actionTab?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  secondaryActionText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  secondaryActionUrl?: string;

  @IsOptional()
  @IsBoolean()
  secondaryActionTab?: boolean;

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ContentCardDto)
  cards!: ContentCardDto[];
}

export class ContentTimelineItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  year!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text!: string;
}

export class ContentCaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsString()
  @MaxLength(80)
  type!: string;

  @IsString()
  @MaxLength(500)
  result!: string;
}

export class ContentFaqDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  q!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  a!: string;
}

export class ContentActionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  text!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsBoolean()
  tab?: boolean;
}

export class SaveContentPageDto {
  @ApiProperty({ example: 'company' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]*$/, {
    message:
      '页面编码必须以小写字母开头，且只能包含小写字母、数字、下划线和短横线',
  })
  @MaxLength(120)
  slug!: string;

  @ApiProperty({ example: 'company' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  pageType!: string;

  @ApiProperty({ example: '企业介绍' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  navTitle!: string;

  @ApiProperty({ example: '企业展示' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string;

  @ApiProperty({ example: '中康参芝（通化）' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @ApiPropertyOptional({ example: '/images/brand/authority-portrait.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiPropertyOptional({ example: '查看介绍 ›' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  cardActionText?: string;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ContentStatDto)
  stats!: ContentStatDto[];

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  sections!: ContentBlockDto[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ContentTimelineItemDto)
  timeline!: ContentTimelineItemDto[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ContentCaseDto)
  cases!: ContentCaseDto[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ContentFaqDto)
  faq!: ContentFaqDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ContentActionDto)
  primaryAction?: ContentActionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContentActionDto)
  secondaryAction?: ContentActionDto;
}

export class UpdateContentStatusDto {
  @ApiProperty({ enum: ContentPublishStatusInput })
  @IsEnum(ContentPublishStatusInput)
  status!: ContentPublishStatusInput;
}
