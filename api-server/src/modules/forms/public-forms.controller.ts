import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FormsService } from './forms.service';

@ApiTags('public-forms')
@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @ApiOperation({ summary: '小程序获取已发布的动态表单列表' })
  list(@Query('leadType') leadType?: string) {
    return this.formsService.listPublicForms(leadType);
  }

  @Get(':code')
  @ApiOperation({ summary: '小程序获取已发布的动态表单结构' })
  detail(@Param('code') code: string) {
    return this.formsService.getPublicForm(code);
  }
}
