/*
  Warnings:

  - You are about to drop the column `security_code_expires_at` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "security_code_expires_at",
ADD COLUMN     "security_code_created_at" TIMESTAMP(3),
ALTER COLUMN "name" SET DEFAULT 'no-name',
ALTER COLUMN "initials" SET DEFAULT '';
