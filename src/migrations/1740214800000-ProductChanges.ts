import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class ProductChanges1740214800000 implements MigrationInterface {
  name = 'ProductChanges1740214800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create brands table
    await queryRunner.createTable(
      new Table({
        name: 'brands',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create product_brands junction table
    await queryRunner.createTable(
      new Table({
        name: 'product_brands',
        columns: [
          {
            name: 'product_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'brand_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['product_id'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['brand_id'],
            referencedTableName: 'brands',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Drop color column from products table
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "color"`);

    // Add quantity column to products
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "quantity" integer NOT NULL DEFAULT 0`);

    // Modify seasonal column from boolean to enum
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "seasonal"`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "seasonal" varchar(3) NOT NULL DEFAULT 'no'`);
    await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "CHK_seasonal_enum" CHECK ("seasonal" IN ('yes', 'no'))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse seasonal column changes
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "CHK_seasonal_enum"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "seasonal"`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "seasonal" boolean NOT NULL DEFAULT false`);

    // Remove quantity column
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "quantity"`);

    // Add back color column
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "color" varchar(50)`);

    // Drop junction table
    await queryRunner.dropTable('product_brands');

    // Drop brands table
    await queryRunner.dropTable('brands');
  }
}