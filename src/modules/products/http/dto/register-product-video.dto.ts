import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterProductVideoDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;
}
