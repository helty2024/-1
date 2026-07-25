import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
  ValidateNested,
} from 'class-validator';

export enum ProductPublishStatusInput {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  OFFLINE = 'offline',
}

export class ProductImagesDto {
  @IsString()
  @MaxLength(500)
  main!: string;

  @IsString()
  @MaxLength(500)
  detail!: string;

  @IsString()
  @MaxLength(500)
  scene!: string;

  @IsString()
  @MaxLength(500)
  material!: string;

  @IsString()
  @MaxLength(500)
  other!: string;
}

export class ProductSpecDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  value!: string;
}

export class ProductEvidenceItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  no!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  desc!: string;
}

export class ProductEvidenceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(1000)
  intro!: string;

  @IsString()
  @MaxLength(500)
  image!: string;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ProductEvidenceItemDto)
  items!: ProductEvidenceItemDto[];
}

export class SaveProductDto {
  @ApiProperty({ example: 'premium-wild-ginseng' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]*$/)
  @MaxLength(120)
  slug!: string;

  @ApiProperty({ example: 'ginseng-gift' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  categoryCode!: string;

  @ApiProperty({ example: '珍品野山参' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsString()
  @MaxLength(80)
  shortName!: string;

  @IsString()
  @MaxLength(500)
  subtitle!: string;

  @IsString()
  @MaxLength(300)
  category!: string;

  @IsString()
  @MaxLength(3000)
  position!: string;

  @IsString()
  @MaxLength(2000)
  people!: string;

  @IsString()
  @MaxLength(2000)
  channels!: string;

  @IsString()
  @MaxLength(80)
  role!: string;

  @IsString()
  @MaxLength(1000)
  listNote!: string;

  @IsString()
  @MaxLength(1000)
  listScene!: string;

  @IsString()
  @MaxLength(500)
  coverImage!: string;

  @ValidateNested()
  @Type(() => ProductImagesDto)
  images!: ProductImagesDto;

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  sellingPoints!: string[];

  @IsString()
  @MaxLength(5000)
  material!: string;

  @IsString()
  @MaxLength(5000)
  craft!: string;

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  specs!: ProductSpecDto[];

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  scenarios!: string[];

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  agencyValue!: string[];

  @IsString()
  @MaxLength(3000)
  compliance!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductEvidenceDto)
  evidence?: ProductEvidenceDto;

  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder!: number;
}

export class UpdateProductStatusDto {
  @ApiProperty({ enum: ProductPublishStatusInput })
  @IsEnum(ProductPublishStatusInput)
  status!: ProductPublishStatusInput;
}
