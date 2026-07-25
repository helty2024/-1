import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { MediaQueryDto } from './dto/media-query.dto';
import { MediaMetadataDto } from './dto/media-metadata.dto';
import { mediaMulterOptions } from './media-storage';
import { MediaService } from './media.service';

@ApiTags('admin-media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/media-assets')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @RequirePermissions('media:read')
  @ApiOperation({ summary: '获取媒体资料列表' })
  list(@Query() query: MediaQueryDto) {
    return this.mediaService.list(query);
  }

  @Post('upload')
  @RequirePermissions('media:upload')
  @UseInterceptors(FileInterceptor('file', mediaMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        altText: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: '上传图片或 PDF 资料' })
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: MediaMetadataDto,
    @Req() request: RequestWithId,
  ) {
    if (!file) throw new BadRequestException('请选择需要上传的文件');
    return this.mediaService.upload(file, dto, request.user!.sub, request);
  }

  @Patch(':id')
  @RequirePermissions('media:upload')
  @ApiOperation({ summary: '修改媒体文件说明' })
  update(
    @Param('id') id: string,
    @Body() dto: MediaMetadataDto,
    @Req() request: RequestWithId,
  ) {
    return this.mediaService.update(id, dto, request.user!.sub, request);
  }

  @Delete(':id')
  @RequirePermissions('media:delete')
  @ApiOperation({ summary: '软删除媒体文件记录' })
  remove(@Param('id') id: string, @Req() request: RequestWithId) {
    return this.mediaService.remove(id, request.user!.sub, request);
  }
}
