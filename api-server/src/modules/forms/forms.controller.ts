import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { SaveFormDto } from './dto/save-form.dto';
import { FormsService } from './forms.service';

@ApiTags('admin-forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @RequirePermissions('form:read')
  @ApiOperation({ summary: '获取动态表单列表' })
  list() {
    return this.formsService.listAdminForms();
  }

  @Get(':id')
  @RequirePermissions('form:read')
  @ApiOperation({ summary: '获取动态表单详情' })
  detail(@Param('id') id: string) {
    return this.formsService.getAdminForm(id);
  }

  @Post()
  @RequirePermissions('form:write')
  @ApiOperation({ summary: '创建动态表单' })
  create(@Body() dto: SaveFormDto) {
    return this.formsService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('form:write')
  @ApiOperation({ summary: '更新动态表单及字段' })
  update(@Param('id') id: string, @Body() dto: SaveFormDto) {
    return this.formsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('form:write')
  @ApiOperation({ summary: '下线并删除动态表单' })
  remove(@Param('id') id: string) {
    return this.formsService.remove(id);
  }
}
