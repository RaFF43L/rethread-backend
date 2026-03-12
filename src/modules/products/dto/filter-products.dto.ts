import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../entities/product.entity';

export class FilterProductsDto {
  @ApiProperty({ required: false, enum: ProductCategory, example: ProductCategory.CALCA })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiProperty({ required: false, example: 'M' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({ required: false, example: 'blue' })
  @IsOptional()
  @IsString()
  cor?: string;

  @ApiProperty({ required: false, example: 'Nike' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiProperty({ required: false, example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMin?: number;

  @ApiProperty({ required: false, example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMax?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page: number = 1;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit: number = 20;
}
