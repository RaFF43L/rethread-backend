import { applyDecorators, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnyAuthenticated } from '../../../../common/decorators/any-authenticated.decorator';
import { Public } from '../../../../common/decorators/public.decorator';
import { DevelopmentOnlyGuard } from '../guards/development-only.guard';

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
    AnyAuthenticated(),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Revoke the refresh token and its access tokens' }),
    ApiResponse({ status: 200, description: 'Logged out.' }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
  );

export const GoogleAuthorizationUrlRoute = () =>
  applyDecorators(
    Get('google/authorize-url'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({
      summary: 'Get the URL that starts the Google sign-in',
      description:
        'Redirect the browser to `url` and keep `state` to compare with the one received on the redirect URI.',
    }),
    ApiResponse({ status: 200, description: 'Authorization URL and state.' }),
  );

export const GoogleSignInRoute = () =>
  applyDecorators(
    Post('google/callback'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({
      summary: 'Exchange the Google sign-in authorization code for tokens',
      description: 'Registers the user on the first sign-in (`isNewUser: true`).',
    }),
    ApiResponse({ status: 200, description: 'Authentication successful.' }),
    ApiResponse({ status: 400, description: 'Invalid or expired authorization code.' }),
    ApiResponse({ status: 409, description: 'Email already registered with a password.' }),
  );

export const GoogleSignInRedirectRoute = () =>
  applyDecorators(
    Get('google/callback'),
    HttpCode(HttpStatus.OK),
    Public(),
    UseGuards(DevelopmentOnlyGuard),
    ApiOperation({
      summary: '[Development only] Google sign-in redirect target',
      description:
        'Lets the browser land on the API to test the flow without a frontend. Does not verify `state`; disabled when NODE_ENV=production.',
    }),
    ApiResponse({ status: 200, description: 'Authentication successful.' }),
    ApiResponse({ status: 400, description: 'Sign-in failed or invalid authorization code.' }),
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
