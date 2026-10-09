import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProductDto } from '../http/dto/update-product.dto';

describe('AgentAttributesDto', () => {
  it('parses JSON strings sent through multipart/form-data', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      styleTags: '["vintage","boho"]',
      occasions: 'trabalho',
      measurements: '{"waist":78,"inseam":80}',
    });

    expect(await validate(dto)).toEqual([]);
    expect(dto.styleTags).toEqual(['vintage', 'boho']);
    expect(dto.occasions).toEqual(['trabalho']);
    expect(dto.measurements).toEqual({ waist: 78, inseam: 80 });
  });

  it('accepts regular JSON bodies', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      styleTags: ['vintage'],
      measurements: { waist: 78 },
    });

    expect(await validate(dto)).toEqual([]);
  });

  it('rejects invalid measurements', async () => {
    const dto = plainToInstance(UpdateProductDto, { measurements: '{"waist":-1}' });

    expect(await validate(dto)).not.toEqual([]);
  });
});
