import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleSignInDto {
  @ApiProperty({ example: '9f1c2a3b-4d5e-6f70-8192-a3b4c5d6e7f8' })
  @IsString()
  @IsNotEmpty({ message: 'Authorization code is required.' })
  code!: string;
}
