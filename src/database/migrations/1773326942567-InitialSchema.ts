import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1773326942567 implements MigrationInterface {
  name = 'InitialSchema1773326942567';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."products_status_enum" AS ENUM('available', 'sold');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."products_category_enum" AS ENUM('calca', 'blusa', 'camiseta', 'short', 'vestido');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
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
      CREATE TABLE IF NOT EXISTS "product_images" (
        "id" SERIAL NOT NULL,
        "url_s3" character varying NOT NULL,
        "productId" integer,
        CONSTRAINT "PK_product_images" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "product_images"
          ADD CONSTRAINT "FK_product_images_product"
          FOREIGN KEY ("productId") REFERENCES "products"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='products' AND column_name='category'
        ) THEN
          ALTER TABLE "products" ADD "category" "public"."products_category_enum" NOT NULL;
        END IF;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='products' AND column_name='size'
        ) THEN
          ALTER TABLE "products" ADD "size" character varying NOT NULL;
        END IF;
      END $$
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
