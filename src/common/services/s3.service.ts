import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { CustomError } from '../errors/custom-error';

export interface MulterFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('AWS_ENDPOINT_URL');
    const region = config.getOrThrow<string>('AWS_REGION');
    const bucket = config.getOrThrow<string>('AWS_BUCKET_NAME');

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID_S3'),
        secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY_S3'),
      },
      ...(endpoint && { endpoint, forcePathStyle: true }),
    });

    this.bucket = bucket;
    this.publicBaseUrl =
      config.get<string>('AWS_PUBLIC_URL') || `https://${bucket}.s3.${region}.amazonaws.com`;
  }

  async uploadBase64File(base64: string, folderPath: string, fileName: string): Promise<string> {
    const buffer = Buffer.from(base64, 'base64');
    const fileKey = this.buildKey(folderPath, fileName);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: this.extractMimeType(fileName),
      }),
    );

    return fileKey;
  }

  async uploadBase64ImageFile(
    base64WithPrefix: string,
    folderPath: string,
    fileName: string,
  ): Promise<string> {
    const matches = base64WithPrefix.match(/^data:([^;]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'application/octet-stream';
    const base64Data = matches ? matches[2] : base64WithPrefix;

    const buffer = Buffer.from(base64Data, 'base64');
    const fileKey = this.buildKey(folderPath, fileName);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return fileKey;
  }

  async uploadFile(file: MulterFile, folderPath: string): Promise<string> {
    const sanitizedName = file.originalname.split('/').pop() ?? file.originalname;
    const fileKey = `${folderPath}/${sanitizedName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return fileKey;
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const response = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!response.Body) {
      throw new CustomError(`File not found in S3: ${key}`, HttpStatus.NOT_FOUND);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(chunk as Uint8Array);
    }

    return Buffer.concat(chunks);
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  private buildKey(folderPath: string, fileName: string): string {
    const sanitizedFileName = fileName.split('/').pop() ?? fileName;
    return `${folderPath}/${sanitizedFileName}`;
  }

  private extractMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
  }
}
