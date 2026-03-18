import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterProductVideoDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;
}
