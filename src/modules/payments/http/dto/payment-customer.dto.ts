import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class PaymentCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email.' })
  email!: string;

  @ApiProperty({ example: '12345678909', description: 'CPF (11 digits) or CNPJ (14 digits).' })
  @Matches(/^(\d{11}|\d{14})$/, { message: 'taxId must be a CPF or CNPJ (digits only).' })
  taxId!: string;

  @ApiProperty({ example: '11999999999' })
  @Matches(/^\d{10,13}$/, { message: 'cellphone must contain 10 to 13 digits.' })
  cellphone!: string;
}
