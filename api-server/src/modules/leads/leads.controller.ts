import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { LeadsService } from './leads.service';

@ApiTags('admin-leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @RequirePermissions('lead:read_all')
  @ApiOperation({ summary: '按类型、状态和时间分页查询线索' })
  list(@Query() query: ListLeadsQueryDto) {
    return this.leadsService.list(query);
  }

  @Get('export')
  @RequirePermissions('lead:export')
  @ApiOperation({ summary: '按当前筛选条件导出全部线索 CSV' })
  async exportCsv(
    @Query() query: ListLeadsQueryDto,
    @Req() request: RequestWithId,
    @Res() response: Response,
  ) {
    const result = await this.leadsService.exportCsv(
      query,
      request.user!.sub,
      request,
    );
    response
      .status(200)
      .set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-store',
        'X-Export-Count': String(result.count),
      })
      .send(result.content);
  }

  @Get(':id')
  @RequirePermissions('lead:read_all')
  @ApiOperation({ summary: '查看线索详情与跟进记录' })
  detail(@Param('id') id: string) {
    return this.leadsService.get(id);
  }

  @Patch(':id/status')
  @RequirePermissions('lead:follow')
  @ApiOperation({ summary: '修改线索状态' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() request: RequestWithId,
  ) {
    return this.leadsService.updateStatus(
      id,
      dto.status,
      request.user!.sub,
      request,
    );
  }

  @Post(':id/followups')
  @RequirePermissions('lead:follow')
  @ApiOperation({ summary: '添加线索跟进记录' })
  addFollowup(
    @Param('id') id: string,
    @Body() dto: CreateFollowupDto,
    @Req() request: RequestWithId,
  ) {
    return this.leadsService.addFollowup(id, dto, request.user!.sub, request);
  }

  @Delete(':id')
  @RequirePermissions('lead:follow')
  @ApiOperation({ summary: '软删除线索' })
  remove(@Param('id') id: string, @Req() request: RequestWithId) {
    return this.leadsService.remove(id, request.user!.sub, request);
  }
}
