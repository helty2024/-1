import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('public-products')
@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '小程序获取已发布产品列表' })
  list() {
    return this.productsService.listPublicProducts();
  }

  @Get(':slug')
  @ApiOperation({ summary: '小程序获取已发布产品详情' })
  detail(@Param('slug') slug: string) {
    return this.productsService.getPublicProduct(slug);
  }
}
