import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MediaMetadataDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;
}
