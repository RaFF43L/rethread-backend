import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email.' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'eyJjdHkiOiJKV1QiLCJlbmMiOi...' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required.' })
  refreshToken!: string;
}
