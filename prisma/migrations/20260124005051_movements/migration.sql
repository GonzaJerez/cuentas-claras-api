/*
  Warnings:

  - You are about to drop the column `expense_id` on the `expense_categories` table. All the data in the column will be lost.
  - You are about to drop the column `items` on the `expense_categories` table. All the data in the column will be lost.
  - You are about to drop the column `expense_id` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `expense_id` on the `splits` table. All the data in the column will be lost.
  - You are about to drop the `expenses` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `movement_id` to the `expense_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `movement_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `movement_id` to the `splits` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "expense_categories" DROP CONSTRAINT "expense_categories_expense_id_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_created_by_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_group_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_expense_id_fkey";

-- DropForeignKey
ALTER TABLE "splits" DROP CONSTRAINT "splits_expense_id_fkey";

-- AlterTable
ALTER TABLE "expense_categories" DROP COLUMN "expense_id",
DROP COLUMN "items",
ADD COLUMN     "description" VARCHAR(255),
ADD COLUMN     "movement_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "expense_id",
ADD COLUMN     "movement_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "splits" DROP COLUMN "expense_id",
ADD COLUMN     "movement_id" UUID NOT NULL;

-- DropTable
DROP TABLE "expenses";

-- CreateTable
CREATE TABLE "movements" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "group_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "image_uris" TEXT[],
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "amount" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(255),
    "movement_id" UUID NOT NULL,
    "from_member_id" UUID NOT NULL,
    "to_member_id" UUID NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "splits" ADD CONSTRAINT "splits_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "movements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_member_id_fkey" FOREIGN KEY ("from_member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_member_id_fkey" FOREIGN KEY ("to_member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
