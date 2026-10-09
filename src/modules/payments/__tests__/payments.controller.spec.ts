import { PaymentsController } from '../http/payments.controller';

describe('PaymentsController', () => {
  const createCustomer = { execute: jest.fn() };
  const createPixCharge = { execute: jest.fn() };

  const controller = new PaymentsController(createCustomer as never, createPixCharge as never);

  beforeEach(() => jest.clearAllMocks());

  it('delegates customer creation', () => {
    const dto = {
      name: 'Alice',
      email: 'a@test.com',
      taxId: '12345678909',
      cellphone: '11999999999',
    };
    void controller.customer(dto);
    expect(createCustomer.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates PIX charge creation', () => {
    const dto = { amount: 4000 };
    void controller.pix(dto);
    expect(createPixCharge.execute).toHaveBeenCalledWith(dto);
  });
});
