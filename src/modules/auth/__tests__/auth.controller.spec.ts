import { AuthController } from '../http/auth.controller';

// Thin HTTP adapter tests: each handler must delegate to its use case with the
// request DTO. Use cases are mocked (the controller's collaborators).
describe('AuthController', () => {
  const registerUseCase = { execute: jest.fn() };
  const loginUseCase = { execute: jest.fn() };
  const confirmSignUpUseCase = { execute: jest.fn() };
  const forgotPasswordUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const refreshTokenUseCase = { execute: jest.fn() };
  const logoutUseCase = { execute: jest.fn() };
  const getGoogleAuthorizationUrlUseCase = { execute: jest.fn() };
  const googleSignInUseCase = { execute: jest.fn() };

  const controller = new AuthController(
    registerUseCase as never,
    loginUseCase as never,
    confirmSignUpUseCase as never,
    forgotPasswordUseCase as never,
    resetPasswordUseCase as never,
    refreshTokenUseCase as never,
    logoutUseCase as never,
    getGoogleAuthorizationUrlUseCase as never,
    googleSignInUseCase as never,
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

  it('delegates refresh with the dto', () => {
    const dto = { email: 'a@test.com', refreshToken: 'rt' };
    void controller.refresh(dto);
    expect(refreshTokenUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates logout with the dto', () => {
    const dto = { refreshToken: 'rt' };
    void controller.logout(dto);
    expect(logoutUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates googleAuthorizationUrl', () => {
    void controller.googleAuthorizationUrl();
    expect(getGoogleAuthorizationUrlUseCase.execute).toHaveBeenCalled();
  });

  it('delegates googleSignIn with the dto', () => {
    const dto = { code: 'auth-code' };
    void controller.googleSignIn(dto);
    expect(googleSignInUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates googleSignInRedirect with the code from the query', () => {
    void controller.googleSignInRedirect({ code: 'auth-code', state: 's' });
    expect(googleSignInUseCase.execute).toHaveBeenCalledWith({ code: 'auth-code' });
  });

  it('rejects googleSignInRedirect when the provider returns an error', () => {
    expect(() =>
      controller.googleSignInRedirect({
        error: 'invalid_request',
        error_description: 'invalid_scope',
      }),
    ).toThrow('invalid_scope');
    expect(googleSignInUseCase.execute).not.toHaveBeenCalled();
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
