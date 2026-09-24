import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterProductImageDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;
}
