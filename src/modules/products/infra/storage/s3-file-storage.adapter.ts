import { Injectable } from '@nestjs/common';
import { S3Service } from '../../../../common/services/s3.service';
import { IFileStorage, UploadableFile } from '../../domain/ports/file-storage.port';

// Adapter binding the products FILE_STORAGE port to the shared S3Service.
// Keeps the application layer decoupled from the concrete AWS SDK client.
@Injectable()
export class S3FileStorageAdapter implements IFileStorage {
  constructor(private readonly s3Service: S3Service) {}

  uploadFile(file: UploadableFile, folderPath: string): Promise<string> {
    return this.s3Service.uploadFile(file, folderPath);
  }

  getPublicUrl(key: string): string {
    return this.s3Service.getPublicUrl(key);
  }

  generatePresignedUploadUrl(
    key: string,
    fileType: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    return this.s3Service.generatePresignedUploadUrl(key, fileType, expiresInSeconds);
  }

  deleteFile(key: string): Promise<void> {
    return this.s3Service.deleteFile(key);
  }
}
