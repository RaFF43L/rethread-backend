import { CreateCustomerUseCase } from '../application/use-cases/create-customer.usecase';
import { CreatePixChargeUseCase } from '../application/use-cases/create-pix-charge.usecase';
import { PaymentGatewayError } from '../domain/errors/payment.error';
import { FakePaymentGateway } from './fake-payment-gateway';

const CUSTOMER = {
  name: 'Alice',
  email: 'alice@test.com',
  taxId: '12345678909',
  cellphone: '11999999999',
};

describe('Payments use cases', () => {
  let gateway: FakePaymentGateway;
  let createCustomer: CreateCustomerUseCase;
  let createPixCharge: CreatePixChargeUseCase;

  beforeEach(() => {
    gateway = new FakePaymentGateway();
    createCustomer = new CreateCustomerUseCase(gateway);
    createPixCharge = new CreatePixChargeUseCase(gateway);
  });

  describe('CreateCustomerUseCase', () => {
    it('registers the customer in the payment gateway', async () => {
      const customer = await createCustomer.execute(CUSTOMER);

      expect(customer).toMatchObject({ ...CUSTOMER, id: 'cust_1' });
      expect(gateway.customers).toHaveLength(1);
    });

    it('propagates gateway rejections', async () => {
      await createCustomer.execute(CUSTOMER);
      await expect(createCustomer.execute(CUSTOMER)).rejects.toBeInstanceOf(PaymentGatewayError);
    });
  });

  describe('CreatePixChargeUseCase', () => {
    it('creates a pending PIX charge with the copy-and-paste code and QR image', async () => {
      const charge = await createPixCharge.execute({ amount: 4000, customer: CUSTOMER });

      expect(charge).toMatchObject({ amount: 4000, status: 'PENDING' });
      expect(charge.brCode).toEqual(expect.any(String));
      expect(charge.brCodeBase64).toMatch(/^data:image\/png;base64,/);
      expect(gateway.charges[0].input.customer).toEqual(CUSTOMER);
    });

    it('creates a charge without customer data', async () => {
      await createPixCharge.execute({ amount: 1500, description: 'Pedido #1' });
      expect(gateway.charges[0].input).toEqual({ amount: 1500, description: 'Pedido #1' });
    });
  });
});
