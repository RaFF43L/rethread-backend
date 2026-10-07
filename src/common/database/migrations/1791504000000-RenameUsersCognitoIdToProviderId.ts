import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUsersCognitoIdToProviderId1791504000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'cognito_id'
        ) THEN
          ALTER TABLE "users" RENAME COLUMN "cognito_id" TO "provider_id";
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UQ_users_cognito_id') THEN
          ALTER TABLE "users" RENAME CONSTRAINT "UQ_users_cognito_id" TO "UQ_users_provider_id";
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'provider_id'
        ) THEN
          ALTER TABLE "users" RENAME COLUMN "provider_id" TO "cognito_id";
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UQ_users_provider_id') THEN
          ALTER TABLE "users" RENAME CONSTRAINT "UQ_users_provider_id" TO "UQ_users_cognito_id";
        END IF;
      END $$
    `);
  }
}
