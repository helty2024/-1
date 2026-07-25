import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePublicLeadDto {
  @ApiProperty({ example: 'agent' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]*$/, { message: '表单编码格式不正确' })
  @MaxLength(64)
  formCode!: string;

  @ApiProperty({ example: { name: '张先生', phone: '13800138000' } })
  @IsObject()
  values!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'wechat_miniprogram' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]*$/, { message: '来源标识格式不正确' })
  @MaxLength(80)
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sourceDetail?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '客户端为本次提交生成的唯一编号，用于防止重复提交',
    example: 'submit_1753410000000_q8m3p2w9',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{16,80}$/, { message: '提交编号格式不正确' })
  submissionId?: string;

  @ApiPropertyOptional({ description: '用户打开表单的时间' })
  @IsOptional()
  @IsISO8601()
  formStartedAt?: string;

  @ApiPropertyOptional({
    description: '反自动提交陷阱字段，正常客户端必须留空',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
