import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Module } from '../../common/services/s3.module';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsDashboardService } from './services/products-dashboard.service';
import { ProductsSql } from './sql/products.sql';
import { ProductsService } from './services/products.service';
import { ProductVideo } from './entities/product-video.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage, ProductVideo]), S3Module],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsSql, ProductsDashboardService],
})
export class ProductsModule {}
