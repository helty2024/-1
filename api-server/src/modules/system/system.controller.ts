import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import {
  CreateAdminUserDto,
  ListAdminUsersQueryDto,
  ResetAdminPasswordDto,
  UpdateAdminUserDto,
  UpdateAdminUserStatusDto,
} from './dto/admin-user.dto';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { SystemService } from './system.service';

@ApiTags('admin-system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('users')
  @RequirePermissions('system:user_manage')
  @ApiOperation({ summary: '管理员列表' })
  listUsers(@Query() query: ListAdminUsersQueryDto) {
    return this.systemService.listUsers(query);
  }

  @Post('users')
  @RequirePermissions('system:user_manage')
  @ApiOperation({ summary: '新增管理员' })
  createUser(@Body() dto: CreateAdminUserDto, @Req() request: RequestWithId) {
    return this.systemService.createUser(dto, request.user!.sub, request);
  }

  @Put('users/:id')
  @RequirePermissions('system:user_manage')
  @ApiOperation({ summary: '编辑管理员和角色' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @Req() request: RequestWithId,
  ) {
    return this.systemService.updateUser(id, dto, request.user!.sub, request);
  }

  @Patch('users/:id/status')
  @RequirePermissions('system:user_manage')
  @ApiOperation({ summary: '启用或停用管理员' })
  updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserStatusDto,
    @Req() request: RequestWithId,
  ) {
    return this.systemService.updateUserStatus(
      id,
      dto,
      request.user!.sub,
      request,
    );
  }

  @Patch('users/:id/password')
  @RequirePermissions('system:user_manage')
  @ApiOperation({ summary: '重置其他管理员密码' })
  resetUserPassword(
    @Param('id') id: string,
    @Body() dto: ResetAdminPasswordDto,
    @Req() request: RequestWithId,
  ) {
    return this.systemService.resetUserPassword(
      id,
      dto,
      request.user!.sub,
      request,
    );
  }

  @Get('roles')
  @RequirePermissions('system:role_manage')
  @ApiOperation({ summary: '角色列表' })
  listRoles() {
    return this.systemService.listRoles();
  }

  @Get('role-options')
  @RequirePermissions('system:user_manage')
  @ApiOperation({ summary: '管理员角色选项' })
  listRoleOptions() {
    return this.systemService.listRoleOptions();
  }

  @Get('permissions')
  @RequirePermissions('system:role_manage')
  @ApiOperation({ summary: '权限列表' })
  listPermissions() {
    return this.systemService.listPermissions();
  }

  @Post('roles')
  @RequirePermissions('system:role_manage')
  @ApiOperation({ summary: '新增角色' })
  createRole(@Body() dto: CreateRoleDto, @Req() request: RequestWithId) {
    return this.systemService.createRole(dto, request.user!.sub, request);
  }

  @Put('roles/:id')
  @RequirePermissions('system:role_manage')
  @ApiOperation({ summary: '编辑角色权限' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() request: RequestWithId,
  ) {
    return this.systemService.updateRole(id, dto, request.user!.sub, request);
  }

  @Delete('roles/:id')
  @RequirePermissions('system:role_manage')
  @ApiOperation({ summary: '删除自定义角色' })
  removeRole(@Param('id') id: string, @Req() request: RequestWithId) {
    return this.systemService.removeRole(id, request.user!.sub, request);
  }

  @Get('audit-logs')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: '审计日志列表' })
  listAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.systemService.listAuditLogs(query);
  }

  @Get('audit-options')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: '审计日志筛选项' })
  getAuditOptions() {
    return this.systemService.getAuditOptions();
  }
}
