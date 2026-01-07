-- CreateEnum
CREATE TYPE "CategoryState" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "state" "CategoryState" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "split_type" SET DEFAULT 'EQUAL';
