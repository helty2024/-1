import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LeadStatusInput } from './list-leads-query.dto';

export enum FollowTypeInput {
  PHONE = 'phone',
  WECHAT = 'wechat',
  VISIT = 'visit',
  NOTE = 'note',
}

export class CreateFollowupDto {
  @ApiProperty({ enum: FollowTypeInput, default: FollowTypeInput.NOTE })
  @IsEnum(FollowTypeInput)
  followType!: FollowTypeInput;

  @ApiProperty({ example: '已电话沟通，对区域代理政策感兴趣。' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ enum: LeadStatusInput })
  @IsOptional()
  @IsEnum(LeadStatusInput)
  nextStatus?: LeadStatusInput;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextFollowAt?: string;
}
