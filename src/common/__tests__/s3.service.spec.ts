import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { CustomError } from '../errors/custom-error';
import { S3Service } from '../services/s3.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
  GetObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
  DeleteObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
}));

const mockConfigService = {
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      AWS_ENDPOINT_URL: '',
    };
    return values[key] ?? undefined;
  }),
  getOrThrow: jest.fn((key: string) => {
    const values: Record<string, string> = {
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID_S3: 'mock-key-id',
      AWS_SECRET_ACCESS_KEY_S3: 'mock-secret',
      AWS_BUCKET_NAME: 'mock-bucket',
    };
    return values[key];
  }),
};

function makeReadable(chunks: string[]): Readable {
  const readable = new Readable({ read() {} });
  chunks.forEach((c) => readable.push(c));
  readable.push(null);
  return readable;
}

describe('S3Service', () => {
  let service: S3Service;

  const MockedPutObjectCommand = jest.mocked(PutObjectCommand);
  const MockedDeleteObjectCommand = jest.mocked(DeleteObjectCommand);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  describe('uploadBase64File', () => {
    it('should upload and return the file key', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.uploadBase64File(
        Buffer.from('hello').toString('base64'),
        'products/images',
        'photo.jpg',
      );

      expect(result).toBe('products/images/photo.jpg');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should sanitize file name containing path separators', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.uploadBase64File(
        Buffer.from('hello').toString('base64'),
        'products',
        'some/nested/photo.png',
      );

      expect(result).toBe('products/photo.png');
    });
  });

  describe('uploadBase64ImageFile', () => {
    it('should extract mime type from data URI prefix', async () => {
      mockSend.mockResolvedValue({});

      await service.uploadBase64ImageFile(
        `data:image/png;base64,${Buffer.from('img').toString('base64')}`,
        'products',
        'img.png',
      );

      expect(MockedPutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'image/png' }),
      );
    });

    it('should default to octet-stream when no data URI prefix is present', async () => {
      mockSend.mockResolvedValue({});

      await service.uploadBase64ImageFile(
        Buffer.from('raw').toString('base64'),
        'products',
        'file.bin',
      );

      expect(MockedPutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'application/octet-stream' }),
      );
    });
  });

  describe('uploadFile', () => {
    it('should upload a multer file and return the key', async () => {
      mockSend.mockResolvedValue({});

      const multerFile = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('data'),
      };

      const result = await service.uploadFile(multerFile, 'products/photo');

      expect(result).toBe('products/photo/photo.jpg');
    });
  });

  describe('getPublicUrl', () => {
    it('should return the public URL for a key', () => {
      const url = service.getPublicUrl('products/photo.jpg');

      expect(url).toBe('https://mock-bucket.s3.us-east-1.amazonaws.com/products/photo.jpg');
    });
  });

  describe('getFileBuffer', () => {
    it('should return a buffer from the S3 stream', async () => {
      mockSend.mockResolvedValue({ Body: makeReadable(['hello', ' world']) });

      const buffer = await service.getFileBuffer('products/photo.jpg');

      expect(buffer.toString()).toBe('hello world');
    });

    it('should throw CustomError with NOT_FOUND when body is missing', async () => {
      mockSend.mockResolvedValue({ Body: null });

      await expect(service.getFileBuffer('missing.jpg')).rejects.toThrow(CustomError);
      await expect(service.getFileBuffer('missing.jpg')).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('deleteFile', () => {
    it('should call DeleteObjectCommand with the given key', async () => {
      mockSend.mockResolvedValue({});

      await service.deleteFile('products/photo.jpg');

      expect(MockedDeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ Key: 'products/photo.jpg', Bucket: 'mock-bucket' }),
      );
    });
  });
});
