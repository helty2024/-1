import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { ContentService } from './content.service';
import {
  SaveContentPageDto,
  UpdateContentStatusDto,
} from './dto/save-content-page.dto';

@ApiTags('admin-content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/content-pages')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @RequirePermissions('content:read')
  @ApiOperation({ summary: '获取内容页面列表' })
  list() {
    return this.contentService.listAdminPages();
  }

  @Get(':id')
  @RequirePermissions('content:read')
  @ApiOperation({ summary: '获取内容页面详情' })
  detail(@Param('id') id: string) {
    return this.contentService.getAdminPage(id);
  }

  @Post()
  @RequirePermissions('content:write')
  @ApiOperation({ summary: '创建内容页面草稿' })
  create(@Body() dto: SaveContentPageDto, @Req() request: RequestWithId) {
    return this.contentService.create(dto, request.user!.sub, request);
  }

  @Put(':id')
  @RequirePermissions('content:write')
  @ApiOperation({ summary: '更新内容页面' })
  update(
    @Param('id') id: string,
    @Body() dto: SaveContentPageDto,
    @Req() request: RequestWithId,
  ) {
    return this.contentService.update(id, dto, request.user!.sub, request);
  }

  @Patch(':id/status')
  @RequirePermissions('content:publish')
  @ApiOperation({ summary: '发布、下线或转为草稿' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContentStatusDto,
    @Req() request: RequestWithId,
  ) {
    return this.contentService.updateStatus(
      id,
      dto.status,
      request.user!.sub,
      request,
    );
  }

  @Delete(':id')
  @RequirePermissions('content:write')
  @ApiOperation({ summary: '软删除内容页面' })
  remove(@Param('id') id: string, @Req() request: RequestWithId) {
    return this.contentService.remove(id, request.user!.sub, request);
  }
}
