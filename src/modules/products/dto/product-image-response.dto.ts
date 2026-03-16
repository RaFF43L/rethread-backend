import { ApiProperty } from '@nestjs/swagger';

export class ProductImageResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/image.jpg' })
  urlS3!: string;
}
