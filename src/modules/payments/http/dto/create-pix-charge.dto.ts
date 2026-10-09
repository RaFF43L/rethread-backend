import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { PaymentCustomerDto } from './payment-customer.dto';

export class CreatePixChargeDto {
  @ApiProperty({ example: 4000, description: 'Amount in cents (4000 = R$40.00).' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 3600, description: 'Expiration time in seconds.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresIn?: number;

  @ApiPropertyOptional({ example: 'Pedido #123' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ type: PaymentCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentCustomerDto)
  customer?: PaymentCustomerDto;
}
