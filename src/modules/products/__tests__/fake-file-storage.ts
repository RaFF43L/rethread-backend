import type { IFileStorage, UploadableFile } from '../domain/ports/file-storage.port';

// In-memory fake for the object storage boundary. Resolves keys into
// deterministic public URLs so presenter output is assertable without S3.
export class FakeFileStorage implements IFileStorage {
  static readonly BASE_URL = 'https://cdn.test/';

  readonly uploaded: { file: UploadableFile; folderPath: string }[] = [];
  readonly deleted: string[] = [];
  private uploadSequence = 0;

  uploadFile(file: UploadableFile, folderPath: string): Promise<string> {
    this.uploadSequence += 1;
    this.uploaded.push({ file, folderPath });
    return Promise.resolve(`${folderPath}/${this.uploadSequence}-${file.originalname}`);
  }

  getPublicUrl(key: string): string {
    return `${FakeFileStorage.BASE_URL}${key}`;
  }

  generatePresignedUploadUrl(
    key: string,
    _fileType: string,
    _expiresInSeconds?: number,
  ): Promise<string> {
    return Promise.resolve(`${FakeFileStorage.BASE_URL}upload/${key}`);
  }

  deleteFile(key: string): Promise<void> {
    this.deleted.push(key);
    return Promise.resolve();
  }
}
