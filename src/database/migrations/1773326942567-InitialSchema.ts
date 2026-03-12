import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1773326942567 implements MigrationInterface {
  name = 'InitialSchema1773326942567';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('available', 'sold')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_category_enum" AS ENUM('calca', 'blusa', 'camiseta', 'short', 'vestido')`,
    );
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" SERIAL NOT NULL,
        "codigo_identificacao" uuid NOT NULL,
        "cor" character varying NOT NULL,
        "marca" character varying NOT NULL,
        "status" "public"."products_status_enum" NOT NULL DEFAULT 'available',
        "category" "public"."products_category_enum" NOT NULL,
        "size" character varying NOT NULL,
        "descricao" text NOT NULL,
        "preco" numeric(10,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_products_codigo_identificacao" UNIQUE ("codigo_identificacao"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id" SERIAL NOT NULL,
        "url_s3" character varying NOT NULL,
        "productId" integer,
        CONSTRAINT "PK_product_images" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "product_images"
        ADD CONSTRAINT "FK_product_images_product"
        FOREIGN KEY ("productId") REFERENCES "products"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_product"`,
    );
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
  }
}
