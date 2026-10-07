import { applyDecorators, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';

export const AuthTag = () => applyDecorators(ApiTags('Auth'));

export const RegisterRoute = () =>
  applyDecorators(
    Post('register'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Register a new user' }),
    ApiResponse({ status: 201, description: 'User registered successfully.' }),
    ApiResponse({ status: 409, description: 'Email already in use.' }),
  );

export const LoginRoute = () =>
  applyDecorators(
    Post('login'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Authenticate user and return tokens' }),
    ApiResponse({ status: 200, description: 'Authentication successful.' }),
    ApiResponse({ status: 401, description: 'Invalid credentials.' }),
  );

export const RefreshTokenRoute = () =>
  applyDecorators(
    Post('refresh'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Issue new access/id tokens from a refresh token' }),
    ApiResponse({ status: 200, description: 'Tokens refreshed.' }),
    ApiResponse({ status: 401, description: 'Refresh token expired or revoked.' }),
  );

export const LogoutRoute = () =>
  applyDecorators(
    Post('logout'),
    HttpCode(HttpStatus.OK),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Revoke the refresh token and its access tokens' }),
    ApiResponse({ status: 200, description: 'Logged out.' }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
  );

export const ConfirmSignUpRoute = () =>
  applyDecorators(
    Post('confirm'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Confirm user sign-up with verification code' }),
    ApiResponse({ status: 200, description: 'Account confirmed.' }),
  );

export const ForgotPasswordRoute = () =>
  applyDecorators(
    Post('forgot-password'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Send password reset code to email' }),
    ApiResponse({ status: 200, description: 'Reset code sent.' }),
  );

export const ResetPasswordRoute = () =>
  applyDecorators(
    Post('reset-password'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Reset password using the verification code' }),
    ApiResponse({ status: 200, description: 'Password reset successfully.' }),
  );
