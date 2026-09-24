// Pure domain entity for a product video. The stored value `urlS3` is the S3
// object key; public URLs are resolved by the file storage port in the app layer.
export class ProductVideo {
  private constructor(
    public urlS3: string,
    public id?: number,
  ) {}

  static create(urlS3: string): ProductVideo {
    return new ProductVideo(urlS3);
  }

  static restore(row: { id?: number; url_s3: string }): ProductVideo {
    return new ProductVideo(row.url_s3, row.id);
  }
}
