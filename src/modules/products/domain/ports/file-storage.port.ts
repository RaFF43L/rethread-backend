// Injection token for the file storage port used by the products module.
export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface UploadableFile {
  readonly originalname: string;
  readonly mimetype: string;
  readonly buffer: Buffer;
}

// Port abstracting object storage (S3). The domain/application layers depend on
// this interface only; the concrete S3 adapter lives in infra.
export interface IFileStorage {
  uploadFile(file: UploadableFile, folderPath: string): Promise<string>;
  getPublicUrl(key: string): string;
  generatePresignedUploadUrl(
    key: string,
    fileType: string,
    expiresInSeconds?: number,
  ): Promise<string>;
  deleteFile(key: string): Promise<void>;
}
