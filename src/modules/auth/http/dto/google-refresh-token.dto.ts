import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleRefreshTokenDto {
  @ApiProperty({ example: 'eyJjdHkiOiJKV1QiLCJlbmMiOi...' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required.' })
  refreshToken!: string;
}
