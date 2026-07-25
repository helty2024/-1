import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '管理员登录' })
  login(@Body() dto: LoginDto, @Req() request: RequestWithId) {
    return this.authService.login(dto, request);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前管理员信息' })
  me(@Req() request: RequestWithId) {
    return this.authService.getCurrentAdmin(request.user!.sub);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改当前管理员账号和显示名称' })
  updateProfile(@Body() dto: UpdateProfileDto, @Req() request: RequestWithId) {
    return this.authService.updateProfile(request.user!.sub, dto, request);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改当前管理员密码' })
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: RequestWithId,
  ) {
    return this.authService.changePassword(request.user!.sub, dto, request);
  }
}
