import { AuthController } from '../http/auth.controller';

// Thin HTTP adapter tests: each handler must delegate to its use case with the
// request DTO. Use cases are mocked (the controller's collaborators).
describe('AuthController', () => {
  const registerUseCase = { execute: jest.fn() };
  const loginUseCase = { execute: jest.fn() };
  const confirmSignUpUseCase = { execute: jest.fn() };
  const forgotPasswordUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };

  const controller = new AuthController(
    registerUseCase as never,
    loginUseCase as never,
    confirmSignUpUseCase as never,
    forgotPasswordUseCase as never,
    resetPasswordUseCase as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates register with the dto', () => {
    const dto = { email: 'a@test.com', name: 'Alice' };
    void controller.register(dto);
    expect(registerUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates login with the dto', () => {
    const dto = { email: 'a@test.com', password: 'x' };
    void controller.login(dto);
    expect(loginUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates confirmSignUp with the dto', () => {
    const dto = { email: 'a@test.com', code: '123456' };
    void controller.confirmSignUp(dto);
    expect(confirmSignUpUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates forgotPassword with the dto', () => {
    const dto = { email: 'a@test.com' };
    void controller.forgotPassword(dto);
    expect(forgotPasswordUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates resetPassword with the dto', () => {
    const dto = { email: 'a@test.com', code: '654321', newPassword: 'New1!' };
    void controller.resetPassword(dto);
    expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(dto);
  });
});
