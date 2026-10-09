import { PaymentGatewayError } from '../domain/errors/payment.error';
import type {
  CreatePixChargeInput,
  IPaymentGateway,
  PaymentCustomer,
  PaymentCustomerInput,
  PixCharge,
} from '../domain/ports/payment-gateway.port';

export class FakePaymentGateway implements IPaymentGateway {
  readonly customers: PaymentCustomer[] = [];
  readonly charges: (PixCharge & { input: CreatePixChargeInput })[] = [];

  async createCustomer(input: PaymentCustomerInput): Promise<PaymentCustomer> {
    if (this.customers.some((c) => c.taxId === input.taxId)) {
      throw new PaymentGatewayError('Customer already exists.');
    }
    const customer = { ...input, id: `cust_${this.customers.length + 1}`, devMode: true };
    this.customers.push(customer);
    return customer;
  }

  async createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
    const charge: PixCharge = {
      id: `pix_char_${this.charges.length + 1}`,
      amount: input.amount,
      status: 'PENDING',
      brCode: '00020101021226950014br.gov.bcb.pix',
      brCodeBase64: 'data:image/png;base64,AAAA',
      expiresAt: new Date(Date.now() + (input.expiresIn ?? 3600) * 1000).toISOString(),
      devMode: true,
    };
    this.charges.push({ ...charge, input });
    return charge;
  }
}
