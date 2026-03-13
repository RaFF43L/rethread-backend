import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Module } from '../../common/services/s3.module';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsDashboardService } from './services/products-dashboard.service';
import { ProductsSql } from './sql/products.sql';
import { ProductsService } from './services/products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage]), S3Module],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsSql, ProductsDashboardService],
})
export class ProductsModule {}
