import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory } from '../../domain/entities/product.entity';

export class CreateMediaDto {
  @ApiProperty({ example: 'foto-1.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  fileType!: string;
}

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

  @ApiPropertyOptional({
    type: [CreateMediaDto],
    description:
      'Lista de mídias (imagens/vídeos) do produto. Quando informada, a resposta inclui uma URL pré-assinada por item, para upload direto no S3.',
    example: [{ fileName: 'foto-1.jpg', fileType: 'image/jpeg' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  media?: CreateMediaDto[];
}
