import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { CustomError } from '../../../common/errors/custom-error';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  AuthFlowType: { USER_PASSWORD_AUTH: 'USER_PASSWORD_AUTH' },
  SignUpCommand: jest.fn(),
  InitiateAuthCommand: jest.fn(),
  ConfirmSignUpCommand: jest.fn(),
  ForgotPasswordCommand: jest.fn(),
  ConfirmForgotPasswordCommand: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    mockSend.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('mock-client-id') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should return success message and userId', async () => {
      mockSend.mockResolvedValue({ UserSub: 'user-123' });

      const result = await service.register({
        email: 'test@test.com',
        password: 'Password@123',
        name: 'Test User',
      });

      expect(result.message).toContain('Registration successful');
      expect(result.userId).toBe('user-123');
    });

    it('should throw ConflictException for duplicate email', async () => {
      const error = Object.assign(new Error(), { name: 'UsernameExistsException' });
      mockSend.mockRejectedValue(error);

      await expect(
        service.register({ email: 'test@test.com', password: 'Password@123', name: 'Test' }),
      ).rejects.toThrow(CustomError);
    });

    it('should throw BadRequestException for invalid password', async () => {
      const error = Object.assign(new Error(), { name: 'InvalidPasswordException' });
      mockSend.mockRejectedValue(error);

      await expect(
        service.register({ email: 'test@test.com', password: 'weak', name: 'Test' }),
      ).rejects.toThrow(CustomError);
    });
  });

  describe('login', () => {
    it('should return tokens on success', async () => {
      mockSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
        },
      });

      const result = await service.login({ email: 'test@test.com', password: 'Password@123' });

      expect(result.accessToken).toBe('access-token');
      expect(result.idToken).toBe('id-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw UnauthorizedException for wrong credentials', async () => {
      const error = Object.assign(new Error(), { name: 'NotAuthorizedException' });
      mockSend.mockRejectedValue(error);

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(
        CustomError,
      );
    });

    it('should throw ForbiddenException for unconfirmed account', async () => {
      const error = Object.assign(new Error(), { name: 'UserNotConfirmedException' });
      mockSend.mockRejectedValue(error);

      await expect(
        service.login({ email: 'test@test.com', password: 'Password@123' }),
      ).rejects.toThrow(CustomError);
    });
  });

  describe('confirmSignUp', () => {
    it('should confirm account successfully', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.confirmSignUp({ email: 'test@test.com', code: '123456' });

      expect(result.message).toContain('confirmed');
    });

    it('should throw BadRequestException for wrong code', async () => {
      const error = Object.assign(new Error(), { name: 'CodeMismatchException' });
      mockSend.mockRejectedValue(error);

      await expect(
        service.confirmSignUp({ email: 'test@test.com', code: '000000' }),
      ).rejects.toThrow(CustomError);
    });
  });

  describe('forgotPassword', () => {
    it('should return generic success message', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.forgotPassword({ email: 'test@test.com' });

      expect(result.message).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.resetPassword({
        email: 'test@test.com',
        code: '123456',
        newPassword: 'NewPassword@123',
      });

      expect(result.message).toContain('Password reset successfully');
    });

    it('should throw BadRequestException for expired code', async () => {
      const error = Object.assign(new Error(), { name: 'ExpiredCodeException' });
      mockSend.mockRejectedValue(error);

      await expect(
        service.resetPassword({
          email: 'test@test.com',
          code: '123456',
          newPassword: 'NewPassword@123',
        }),
      ).rejects.toThrow(CustomError);
    });
  });
});
