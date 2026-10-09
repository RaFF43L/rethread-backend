export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface PaymentCustomerInput {
  readonly name: string;
  readonly email: string;
  readonly taxId: string;
  readonly cellphone: string;
}

export interface PaymentCustomer extends PaymentCustomerInput {
  readonly id: string;
  readonly devMode: boolean;
}

export type PixChargeStatus = 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED';

export interface CreatePixChargeInput {
  // In cents (e.g. 4000 = R$40.00).
  readonly amount: number;
  readonly expiresIn?: number;
  readonly description?: string;
  readonly customer?: PaymentCustomerInput;
}

export interface PixCharge {
  readonly id: string;
  readonly amount: number;
  readonly status: PixChargeStatus;
  readonly brCode: string;
  readonly brCodeBase64: string;
  readonly expiresAt: string;
  readonly devMode: boolean;
}

export interface IPaymentGateway {
  createCustomer(input: PaymentCustomerInput): Promise<PaymentCustomer>;
  createPixCharge(input: CreatePixChargeInput): Promise<PixCharge>;
}
