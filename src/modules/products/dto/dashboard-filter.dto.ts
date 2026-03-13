import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory, ProductStatus } from '../entities/product.entity';

export class DashboardFilterDto {
  @ApiProperty({ required: false, example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, enum: ProductCategory, example: ProductCategory.CALCA })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiProperty({ required: false, example: 'M' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({ required: false, example: 'Nike' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiProperty({ required: false, example: 'blue' })
  @IsOptional()
  @IsString()
  cor?: string;

  @ApiProperty({ required: false, enum: ProductStatus, example: ProductStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
