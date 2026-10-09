import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class MeasurementsDto {
  @ApiPropertyOptional({ example: 96, description: 'In centimeters.' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  chest?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  waist?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  hip?: number;

  @ApiPropertyOptional({ example: 58 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  thigh?: number;

  @ApiPropertyOptional({ example: 44 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  shoulder?: number;

  @ApiPropertyOptional({ example: 62 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  sleeve?: number;

  @ApiPropertyOptional({ example: 104 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  length?: number;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  rise?: number;

  @ApiPropertyOptional({ example: 78 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  inseam?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  hem?: number;
}
