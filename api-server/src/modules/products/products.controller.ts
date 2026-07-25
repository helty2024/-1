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
import { SaveProductDto, UpdateProductStatusDto } from './dto/save-product.dto';
import { ProductsService } from './products.service';

@ApiTags('admin-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions('product:read')
  @ApiOperation({ summary: '获取产品列表' })
  list() {
    return this.productsService.listAdminProducts();
  }

  @Get(':id')
  @RequirePermissions('product:read')
  @ApiOperation({ summary: '获取产品详情' })
  detail(@Param('id') id: string) {
    return this.productsService.getAdminProduct(id);
  }

  @Post()
  @RequirePermissions('product:write')
  @ApiOperation({ summary: '创建产品草稿' })
  create(@Body() dto: SaveProductDto, @Req() request: RequestWithId) {
    return this.productsService.create(dto, request.user!.sub, request);
  }

  @Put(':id')
  @RequirePermissions('product:write')
  @ApiOperation({ summary: '更新产品' })
  update(
    @Param('id') id: string,
    @Body() dto: SaveProductDto,
    @Req() request: RequestWithId,
  ) {
    return this.productsService.update(id, dto, request.user!.sub, request);
  }

  @Patch(':id/status')
  @RequirePermissions('product:publish')
  @ApiOperation({ summary: '发布、下线或转为草稿' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @Req() request: RequestWithId,
  ) {
    return this.productsService.updateStatus(id, dto.status, request.user!.sub, request);
  }

  @Delete(':id')
  @RequirePermissions('product:write')
  @ApiOperation({ summary: '软删除产品' })
  remove(@Param('id') id: string, @Req() request: RequestWithId) {
    return this.productsService.remove(id, request.user!.sub, request);
  }
}
