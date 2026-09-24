// Pure domain entity for a product image. The stored value `urlS3` is the S3
// object key; public URLs are resolved by the file storage port in the app layer.
export class ProductImage {
  private constructor(
    public urlS3: string,
    public id?: number,
  ) {}

  static create(urlS3: string): ProductImage {
    return new ProductImage(urlS3);
  }

  static restore(row: { id?: number; url_s3: string }): ProductImage {
    return new ProductImage(row.url_s3, row.id);
  }
}
