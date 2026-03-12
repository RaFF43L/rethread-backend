import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'blue' })
  @IsString()
  @IsNotEmpty()
  cor!: string;

  @ApiProperty({ example: 'Nike' })
  @IsString()
  @IsNotEmpty()
  marca!: string;

  @ApiProperty({ example: 'A great shoe' })
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiProperty({ example: 199.99 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  preco!: number;

  @ApiProperty({ enum: ProductCategory, example: ProductCategory.CALCA })
  @IsEnum(ProductCategory)
  category!: ProductCategory;

  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  size!: string;
}
