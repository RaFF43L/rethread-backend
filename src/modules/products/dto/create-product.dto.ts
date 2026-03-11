import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
