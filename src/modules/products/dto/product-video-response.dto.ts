import { ApiProperty } from '@nestjs/swagger';

export class ProductVideoResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/video.mp4' })
  urlS3!: string;
}
