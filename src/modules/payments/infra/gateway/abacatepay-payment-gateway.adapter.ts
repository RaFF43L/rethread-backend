import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayError } from '../../domain/errors/payment.error';
import type {
  CreatePixChargeInput,
  IPaymentGateway,
  PaymentCustomer,
  PaymentCustomerInput,
  PixCharge,
} from '../../domain/ports/payment-gateway.port';

type AbacatePayClient = ReturnType<typeof import('@abacatepay/sdk').AbacatePay>;

type SdkResponse<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

function unwrap<T>(response: SdkResponse<T>): T {
  if (!response.success) {
    throw new PaymentGatewayError(response.error);
  }
  return response.data;
}

@Injectable()
export class AbacatePayPaymentGateway implements IPaymentGateway {
  private client?: Promise<AbacatePayClient>;

  constructor(private readonly config: ConfigService) {}

  async createCustomer(input: PaymentCustomerInput): Promise<PaymentCustomer> {
    const client = await this.getClient();
    const customer = unwrap(await client.customers.create(input));
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      taxId: customer.taxId,
      cellphone: customer.cellphone,
      devMode: customer.devMode,
    };
  }

  async createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
    const client = await this.getClient();
    const charge = unwrap(await client.pix.create(input));
    return {
      id: charge.id,
      amount: charge.amount,
      status: charge.status,
      brCode: charge.brCode,
      brCodeBase64: charge.brCodeBase64,
      expiresAt: charge.expiresAt,
      devMode: charge.devMode,
    };
  }

  // The SDK is ESM-only, so it cannot be require()d from this CommonJS build.
  private getClient(): Promise<AbacatePayClient> {
    this.client ??= import('@abacatepay/sdk').then(({ AbacatePay }) =>
      AbacatePay({ secret: this.config.getOrThrow<string>('ABACATEPAY_API_KEY') }),
    );
    return this.client;
  }
}
