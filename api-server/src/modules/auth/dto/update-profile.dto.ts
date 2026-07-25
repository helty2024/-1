import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(3, { message: '管理员账号至少需要 3 个字符' })
  @MaxLength(64, { message: '管理员账号不能超过 64 个字符' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: '管理员账号只能包含字母、数字、下划线、点和短横线',
  })
  username!: string;

  @ApiProperty({ example: '超级管理员' })
  @IsString()
  @MinLength(2, { message: '显示名称至少需要 2 个字符' })
  @MaxLength(80, { message: '显示名称不能超过 80 个字符' })
  displayName!: string;
}
