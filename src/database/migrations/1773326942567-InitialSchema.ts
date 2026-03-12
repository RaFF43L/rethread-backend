import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773326942567 implements MigrationInterface {
    name = 'InitialSchema1773326942567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "category" "public"."products_category_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" ADD "size" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "size"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
    }

}
