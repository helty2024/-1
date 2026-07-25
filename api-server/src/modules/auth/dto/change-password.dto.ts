import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'ChangeMe_2026!' })
  @IsString()
  @MinLength(8, { message: '当前密码格式不正确' })
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ example: 'A-stronger-password_2026' })
  @IsString()
  @MinLength(10, { message: '新密码至少需要 10 个字符' })
  @MaxLength(128, { message: '新密码不能超过 128 个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message: '新密码必须同时包含大写字母、小写字母、数字和特殊字符',
  })
  newPassword!: string;
}
