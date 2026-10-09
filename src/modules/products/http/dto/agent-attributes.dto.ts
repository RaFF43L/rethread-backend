import { plainToInstance, Transform, type TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  AGENT_DEPARTMENTS,
  AGENT_STRETCH_LEVELS,
  type AgentDepartment,
  type AgentStretch,
} from '../../../ai/domain/ports/ai-agent.port';
import { MeasurementsDto } from '../../../ai/http/dto/measurements.dto';

// multipart/form-data sends everything as text: objects and lists arrive as JSON strings.
function parseJson({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toStringList(params: TransformFnParams): unknown {
  const value = parseJson(params);
  return typeof value === 'string' ? [value] : value;
}

function toMeasurements(params: TransformFnParams): unknown {
  const value = parseJson(params);
  return value !== null && typeof value === 'object' && !(value instanceof MeasurementsDto)
    ? plainToInstance(MeasurementsDto, value)
    : value;
}

// Attributes stored only by the AI agent; they are never persisted here.
export class AgentAttributesDto {
  @ApiPropertyOptional({
    example: 'Calça jeans reta Levis 501',
    description: 'Enviado só ao agente de IA. Padrão na criação: categoria + marca.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: AGENT_DEPARTMENTS, example: 'feminino' })
  @IsOptional()
  @IsIn(AGENT_DEPARTMENTS)
  department?: AgentDepartment;

  @ApiPropertyOptional({ example: 'anos 90', description: 'Ex.: anos 80, anos 90, Y2K' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  era?: string;

  @ApiPropertyOptional({ example: 'BR', description: 'Região do tamanho da etiqueta.' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  sizeRegion?: string;

  @ApiPropertyOptional({ example: 'jeans 100% algodão' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fabric?: string;

  @ApiPropertyOptional({ enum: AGENT_STRETCH_LEVELS, example: 'low' })
  @IsOptional()
  @IsIn(AGENT_STRETCH_LEVELS)
  stretch?: AgentStretch;

  @ApiPropertyOptional({ type: [String], example: ['vintage', 'minimalista'] })
  @IsOptional()
  @Transform(toStringList)
  @IsArray()
  @IsString({ each: true })
  styleTags?: string[];

  @ApiPropertyOptional({ type: [String], example: ['trabalho', 'dia a dia'] })
  @IsOptional()
  @Transform(toStringList)
  @IsArray()
  @IsString({ each: true })
  occasions?: string[];

  @ApiPropertyOptional({ example: 'ótimo estado' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  condition?: string;

  @ApiPropertyOptional({ example: 'Pequeno desgaste na barra.', description: 'Caimento/defeitos.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: MeasurementsDto })
  @IsOptional()
  @Transform(toMeasurements)
  @ValidateNested()
  @Type(() => MeasurementsDto)
  measurements?: MeasurementsDto;
}
