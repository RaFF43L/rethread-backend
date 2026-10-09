import { Inject, Injectable } from '@nestjs/common';
import {
  type CreatePixChargeInput,
  type IPaymentGateway,
  PAYMENT_GATEWAY,
  type PixCharge,
} from '../../domain/ports/payment-gateway.port';

@Injectable()
export class CreatePixChargeUseCase {
  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  execute(input: CreatePixChargeInput): Promise<PixCharge> {
    return this.paymentGateway.createPixCharge(input);
  }
}
