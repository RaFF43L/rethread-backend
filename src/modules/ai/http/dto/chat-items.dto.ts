import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ChatItemsDto {
  @ApiProperty({
    example: ['sku-zara', 'sku-levis'],
    description: 'SKUs recomendados pelo agente de voz (tópico "rethread.skus" da sala).',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  skus!: string[];
}
