import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum MediaKindInput {
  ALL = 'all',
  IMAGE = 'image',
  DOCUMENT = 'document',
}

export class MediaQueryDto {
  @IsOptional()
  @IsEnum(MediaKindInput)
  kind: MediaKindInput = MediaKindInput.ALL;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
