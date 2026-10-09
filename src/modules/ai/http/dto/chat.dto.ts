import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MeasurementsDto } from './measurements.dto';

export class ChatDto {
  @ApiProperty({ example: 'adorei essa calça, ela veste 40 e combina com bota preta?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'true na primeira mensagem do chat: o backend cria uma sessão nova e devolve o session_id no evento "session".',
  })
  @IsOptional()
  @IsBoolean()
  first_interaction?: boolean;

  @ApiPropertyOptional({
    example: '6f1c2d4e-8a9b-4c3d-9e2f-1a2b3c4d5e6f',
    description:
      'session_id recebido no evento "session". Ignorado quando first_interaction é true; sem ele, a mensagem não tem memória.',
  })
  @IsOptional()
  @IsUUID()
  session_id?: string;

  @ApiPropertyOptional({ example: 'b3f1c2d4-0000-0000-0000-000000000000' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  item_id?: string;

  @ApiPropertyOptional({ type: MeasurementsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MeasurementsDto)
  buyer_measurements?: MeasurementsDto;
}
