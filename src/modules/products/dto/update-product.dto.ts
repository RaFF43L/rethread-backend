import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MulterFile } from '../../../common/services/s3.service';
import { ProductCategory } from '../entities/product.entity';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'red' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cor?: string;

  @ApiPropertyOptional({ example: 'Adidas' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  marca?: string;

  @ApiPropertyOptional({ example: 'An updated description' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descricao?: string;

  @ApiPropertyOptional({ example: 249.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  preco?: number;

  @ApiPropertyOptional({ enum: ProductCategory, example: ProductCategory.BLUSA })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiPropertyOptional({ example: 'G' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  size?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', isArray: true, required: false })
  videos?: MulterFile[];
}
