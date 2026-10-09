import { Body, Controller } from '@nestjs/common';
import { CreateCustomerUseCase } from '../application/use-cases/create-customer.usecase';
import { CreatePixChargeUseCase } from '../application/use-cases/create-pix-charge.usecase';
import {
  CreateCustomerRoute,
  CreatePixChargeRoute,
  PaymentsTag,
} from './decorators/payments-routes.decorator';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';
import { PaymentCustomerDto } from './dto/payment-customer.dto';

@PaymentsTag()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly createPixCharge: CreatePixChargeUseCase,
  ) {}

  @CreateCustomerRoute()
  customer(@Body() dto: PaymentCustomerDto) {
    return this.createCustomer.execute(dto);
  }

  @CreatePixChargeRoute()
  pix(@Body() dto: CreatePixChargeDto) {
    return this.createPixCharge.execute(dto);
  }
}
