import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterProductImageDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;
}
