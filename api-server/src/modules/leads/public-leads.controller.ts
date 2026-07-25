import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('public-leads')
@Controller('public/leads')
export class PublicLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: '小程序提交动态表单并创建线索' })
  create(@Body() dto: CreatePublicLeadDto, @Req() request: RequestWithId) {
    return this.leadsService.createPublicLead(dto, request);
  }
}
