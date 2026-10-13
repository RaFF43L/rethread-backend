import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class VoiceTokenDto {
  @ApiPropertyOptional({
    example: '6f1c2d4e-8a9b-4c3d-9e2f-1a2b3c4d5e6f',
    description:
      'session_id do chat a continuar por voz (mesma memória do chat de texto). Sem ele, o backend cria uma sessão nova e devolve o session_id.',
  })
  @IsOptional()
  @IsUUID()
  session_id?: string;

  @ApiPropertyOptional({ example: 'b3f1c2d4-0000-0000-0000-000000000000' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  item_id?: string;
}

export class VoiceTokenResponseDto {
  @ApiProperty({
    example: 'wss://rethread.livekit.cloud',
    description: 'Servidor de voz (LiveKit).',
  })
  url!: string;

  @ApiProperty({ description: 'Token de acesso à sala de voz da sessão. Expira em 10 minutos.' })
  token!: string;

  @ApiProperty({ example: '6f1c2d4e-8a9b-4c3d-9e2f-1a2b3c4d5e6f' })
  session_id!: string;
}
