import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GeneratePresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileType!: string;

  @IsString()
  @IsOptional()
  productId?: string;
}
