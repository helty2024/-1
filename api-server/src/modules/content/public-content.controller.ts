import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';

@ApiTags('public-content')
@Controller('public/content-pages')
export class PublicContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get(':slug')
  @ApiOperation({ summary: '小程序获取已发布内容页面' })
  detail(@Param('slug') slug: string) {
    return this.contentService.getPublicPage(slug);
  }
}
